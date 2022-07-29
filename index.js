

const fetchData = async () => {
    const response = await fetch('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json')
    const data = await response.json()
    return data
}

const renderHeatMap = (data) => {
    
    // Create svg
    
    const w = 2000
    const h = 800
    const chartPadding = 200

    const svg = d3.select('body')
        .append('svg')
            .attr('id', 'svg')
            .attr('class', 'svg')
            .attr('width', w)
            .attr('height', h)
            .style('border', 'solid 1px blue')
    
    svg.append('text')
        .attr('id', 'title')
        .attr('class', 'title')
        .attr('x', '50%')
        .attr('y', 60)
        .attr('text-anchor', 'middle')
        .text('Monthly Global Land-Surface Temperature')

    const yearExtent = d3.extent(data.monthlyVariance, d => d.year)
    
    svg.append('text')
        .attr('id', 'description')
        .attr('class', 'description')
        .attr('x', '50%')
        .attr('y', 100)
        .attr('text-anchor', 'middle')
        .text(`${yearExtent[0]} - ${yearExtent[1]}: base temperature ${data.baseTemperature}\u00B0 C`)


    // Create x axis
    const parseMonth = d3.timeParse('%m')
    const formatMonth = d3.timeFormat('%B')

    const xScale = d3.scaleBand()
        .domain(data.monthlyVariance.map(d => d.year))
        .range([chartPadding, w - chartPadding])


    const xAxis = d3.axisBottom(xScale)
        .tickValues(xScale.domain().filter((d, i) => !((i + 3) % 10)))

    svg.append('g')
            .attr('id', 'x-axis')
            .attr('class', 'axis')
            .attr('transform', `translate(0, ${h - chartPadding})`)
            .call(xAxis.tickFormat(d3.format('d')))

    // Color scale

    const baseTemp = data.baseTemperature
    const colorRange = ['#1d17d1', '#2f8bf5', '#1eabe3', '#b4def0', '#ebe981', '#ed871a', '#ed1a1a', '#911616', '#2e0224']

    const colorScale = d3.scaleQuantize()
        .domain([(baseTemp + d3.min(data.monthlyVariance, d => d.variance)), (baseTemp + d3.max(data.monthlyVariance, d => d.variance))])
        .range(colorRange)
    
    const legendPoints = [baseTemp + d3.min(data.monthlyVariance, d => d.variance), ...colorScale.thresholds(), baseTemp + d3.max(data.monthlyVariance, d => d.variance)]

    const legendScale = d3.scalePoint()
        .domain(legendPoints)
        .range([(chartPadding), (chartPadding + 700)])
        .padding(1)

    const legendAxis = d3.axisBottom(legendScale)

    // svg.selectAll('.legend-tiles')
    //     .data(legendArray)
    //     .enter()
    //     .append('rect')
    //     .attr('id', 'legend')
    //     .attr('class', 'legend-tiles')
    //     .attr('x', (d, i) => legendScale(legendArray[i]))
    //     .attr('y', h - 130)
    //     .attr('width', legendScale.bandwidth())
    //     .attr('height', 30)
    //     .attr('fill', (d, i) => colorRange[i])

    const legend = svg.append('g')
        .attr('id', 'legend')
    
    legend.append('g')
        .attr('id', 'legend-axis')
        .attr('class', 'legend-axis')
        .attr('transform', `translate(0, ${h - 60})`)
        .call(legendAxis.tickFormat(d3.format('.1f')))

    legend.selectAll('.legend-tiles')
        .data(legendPoints.filter(point => point < baseTemp + d3.max(data.monthlyVariance, d => d.variance)))
        .enter()
        .append('rect')
        .attr('id', 'legend-tiles')
        .attr('class', 'legend-tiles')
        .attr('x', (d) => legendScale(d))
        .attr('y', h - 110)
        .attr('width', legendScale.step())
        .attr('height', 50)
        .attr('fill', d => colorScale(d))

    // Create y axis

    const yScale = d3.scaleLinear()
        .domain([1, 12])

    const yBandScale = d3.scaleBand()
        .domain(yScale.ticks().map(month => formatMonth(parseMonth(month))))
        .range([chartPadding, h - chartPadding])

    const yAxis = d3.axisLeft(yBandScale)

    svg.append('g')
        .attr('id', 'y-axis')
        .attr('class', 'axis')
        .attr('transform', `translate(${chartPadding}, 0)`)
        .call(yAxis)
    
    // Create data cells (rectangles)


    svg.selectAll('.cell')
        .data(data.monthlyVariance)
        .enter()
        .append('rect')
            .attr('class', 'cell')
            .attr('x', d => xScale(d.year))
            .attr('y', d => yBandScale(formatMonth(parseMonth(d.month))))
            .attr('height', yBandScale.bandwidth())
            .attr('width', xScale.bandwidth())
            .attr('data-month', d => parseMonth(d.month).getMonth())
            .attr('data-year', d => d.year)
            .attr('data-temp', d => baseTemp + d.variance)
            .attr('fill', d => colorScale(baseTemp + d.variance))
            .on('mouseover', (e) => {
                d3.select('body').append('div')
                    .attr('id', 'tooltip')
                    .attr('class', 'tooltip')
                    .attr('data-year', e.currentTarget.getAttribute('data-year'))
                    .style('position', 'absolute')
                    .style('top', d3.pointer(e)[1] - 110 + 'px')
                    .style('left', d3.pointer(e)[0] + 'px')
                    .append('p')
                        .text(`${e.currentTarget.getAttribute('data-year')} - ${formatMonth(parseMonth(Number(e.currentTarget.getAttribute('data-month')) + 1))}`)
                    .append('p')
                        .text(Number.parseFloat(e.currentTarget.getAttribute('data-temp')).toFixed(1) + '\u00B0 C')
                    .append('p')
                        .text(formatVariance(Number.parseFloat(e.currentTarget.getAttribute('data-temp') - baseTemp).toFixed(1)) + '\u00B0 C'
                    )})
            .on('mouseout', () => document.getElementById('tooltip').remove())

        svg.append('text')
            .attr('id', 'x-label')
            .attr('class', 'label')
            .attr('x', w / 2)
            .attr('y', h - 140)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'center')
            .text('Years')
        
        svg.append('text')
            .attr('id', 'y-label')
            .attr('class', 'label')
            .attr('x', 40)
            .attr('y', h / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'center')
            .attr('transform', `rotate(270, 40, ${h / 2})`)
            .text('Months')
}

const formatVariance = (variance) => {
    if (variance > 0) {
        return `+${variance}`
    }
    return variance
}


const fetchAndRenderHeatMap = async () => {
    const data = await fetchData()
    renderHeatMap(data)
}

fetchAndRenderHeatMap()

