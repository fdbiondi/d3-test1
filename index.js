d3.json('data.json').then((data) => {

  const linkWidthScale = d3
    .scaleLinear()
    .domain([0, d3.max(data.links.map(link => link.weight))])
    .range([0.5, 3]);

  const linkDashScale = d3
    .scaleOrdinal()
    .domain([0, 2, 3])
    .range(['4 2', '2 2', null])

  const nodeScale = d3.scaleLinear()
    .domain([0, d3.max(data.nodes.map(node => node.influence))])
    .range([8, 20])

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

  const simulation = d3.forceSimulation(data.nodes)
    .force('charge', d3.forceManyBody().strength(-125))
    .force('link', d3.forceLink(data.links)
      .id(d => d.id)
      .distance(75))
    .force('center', d3.forceCenter(300, 300))
    .force('gravity', d3.forceManyBody().strength(30))

  const svg = d3.select('#target');

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
          return 'url(#markerArrow)';

        default:
          return 'none';
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

  const lineGenerator = d3.line()

  simulation.on('tick', () => {
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

        const curveSharpness = 8;
        mid[0] += slopeY * curveSharpness
        mid[1] -= slopeX * curveSharpness


      }

      return lineGenerator([
        [d.source.x, d.source.y],
        mid,
        [d.target.x, d.target.y],
      ])
    })

  })

})
