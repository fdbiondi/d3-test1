d3.json('data.json').then((data) => {

  const drag = simulation => {
    const dragStarted = (e, d) => {
      if (!e.active) {
        simulation.alphaTarget(0.3).restart()
      }

      d.x = e.x
      d.y = e.y
    }

    const dragged = (e, d) => {
      d.x = e.x
      d.y = e.y
    }

    const dragEnded = (e, d) => {
      if (!e.active) {
        simulation.alphaTarget(0)
      }
    }

    return d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded)
  }

  const linkWidthScale = d3
    .scaleLinear()
    .domain([0, d3.max(data.links.map(link => link.weight))])
    .range([0.5, 1.25])

  const linkDashScale = d3
    .scaleOrdinal()
    .domain([0, 2, 3])
    .range(['4 2', '2 2', null])

  const nodeScale = d3.scaleLinear()
    .domain([0, d3.max(data.nodes.map(node => node.influence))])
    .range([8, 20])

  const fontSizeScale = d3.scaleLinear()
    .domain([0, d3.max(data.nodes.map(node => node.influence))])
    .range([7, 12])

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

  const simulation = d3.forceSimulation(data.nodes)
    .force('charge', d3.forceManyBody().strength(-125))
    .force('link', d3.forceLink(data.links)
      .id(d => d.id)
      .distance(75)
      // .distance((d, i) => {
      //   // if (i === 0) {
      //   //   return 250
      //   // } else {
      //   //   return 50
      //   // }
      //
      //   if (d.source.id === 0 || d.target.id === 0) {
      //     return 75
      //   } else {
      //     return 50
      //   }
      // })
      .strength(0.15)
      // .strength((d) => {
      //   if (d.source.id === 1 || d.target.id === 1) {
      //     return 2
      //   } else {
      //     return 0.1
      //   }
      // })
    )
    .force('center', d3.forceCenter(300, 300))
    .force('gravity', d3.forceManyBody().strength(30))

  const svg = d3.select('#target')

  const link = svg
    .selectAll('path.link')
    .data(data.links)
    .enter()
    .append('path')
    .attr('stroke', '#999')
    .attr('stroke-width', (d) => linkWidthScale(d.weight))
    .attr('stroke-dasharray', (d) => linkDashScale(d.weight))
    .attr('fill', 'none')
    .attr('marker-mid', (d) => {
      switch (d.type) {
        case 'SUPERVISORY':
          return 'url(#markerArrow)'

        default:
          return 'none'
      }
    })

  const node = svg
    .selectAll('circle')
    .data(data.nodes)
    .enter()
    .append('circle')
    .attr('r', (d) => nodeScale(d.influence))
    .attr('stroke', '#ccc')
    .attr('stroke-width', 0.5)
    .style('fill', (d) => colorScale(d.zone))

  node.call(drag(simulation))

  // const imageContainer = svg
  //   .selectAll('g.imageContainer')
  //   .data(data.nodes)
  //   .enter()
  //   .append('g')
  //
  // const image = imageContainer
  //   .append('image')
  //   .attr('height', (d) => nodeScale(d.influence))
  //   .attr('width', (d) => nodeScale(d.influence))
  //   .attr('transform', (d) => `translate(${-nodeScale(d.influence) / 2}, ${-nodeScale(d.influence) / 2})`)
  //   .attr('href', (d, i) => `image/img-${i}.png`)

  const textContainer = svg
    .selectAll('g.label')
    .data(data.nodes)
    .enter()
    .append('g')

  textContainer
    .append('text')
    .text((d) => d.name)
    .attr('font-size', (d) => fontSizeScale(d.influence))
    .attr('transform', (d) => {
      const scale = nodeScale(d.influence)
      const x = scale + 2
      const y = scale + 4

      return `translate(${x}, ${y})`
    })

  const card = svg
    .append('g')
    .attr('pointer-events', 'none')
    .attr('display', 'none')

  const cardBackground = card.append('rect')
    .attr('width', 150)
    .attr('height', 45)
    .attr('fill', '#eee')
    .attr('stroke', '#333')
    .attr('rx', 4)

  const cardTextName = card
    .append('text')
    .attr('transform', 'translate(8, 20)')
    .attr('text', 'DEFAULT NAME')

  const cardTextRole = card
    .append('text')
    .attr('font-size', 10)
    .attr('transform', 'translate(8, 35)')
    .attr('text', 'DEFAULT role')

  let currentTarget = null

  node.on('mouseover', (d, item) => {
    card.attr('display', 'block')

    currentTarget = d.target

    cardTextName.text(item.name)
    cardTextRole.text(item.role)

    const nameWidth = cardTextName.node().getBBox().width
    const positionWidth = cardTextRole.node().getBBox().width

    const cardWith = Math.max(nameWidth, positionWidth)

    cardBackground.attr('width', cardWith + 16)

    simulation.alphaTarget(0).restart()

  })

  node.on('mouseout', () => {
    currentTarget = null
    card.attr('display', 'none')
  })

  const lineGenerator = d3.line()
    .curve(d3.curveCardinal)

  simulation.on('tick', () => {

    textContainer
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)

    // imageContainer
    //   .attr('transform', (d) => `translate(${d.x}, ${d.y})`)

    node
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)

    link.attr('d', (d) => {
      const mid = [
        (d.source.x + d.target.x) / 2,
        (d.source.y + d.target.y) / 2
      ]

      if (d.overlap > 0) {
        const distance = Math.sqrt(
          Math.pow(d.target.x - d.source.x, 2) +
          Math.pow(d.target.y - d.source.y, 2)
        )

        const slopeX = (d.target.x - d.source.x) / distance
        const slopeY = (d.target.y - d.source.y) / distance

        const curveSharpness = 8
        mid[0] += slopeY * curveSharpness
        mid[1] -= slopeX * curveSharpness
      }

      return lineGenerator([
        [d.source.x, d.source.y],
        mid,
        [d.target.x, d.target.y],
      ])
    })

    if (currentTarget) {
      const radius = currentTarget.r.baseVal.value

      const xPos = currentTarget.cx.baseVal.value + radius + 3
      const yPos = currentTarget.cy.baseVal.value + radius + 3

      card.attr('transform', `translate(${xPos}, ${yPos})`)
    }

  })

})
