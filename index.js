d3.json("data.json").then((data) => {

  const simulation = d3.forceSimulation(data.nodes)
    .force("charge", d3.forceManyBody().strength(-100))
    .force("link", d3.forceLink(data.links)
      .id(d => d.id)
      .distance(75))
    .force("center", d3.forceCenter(300, 300))


  const svg = d3.select("#target");

  const node = svg
    .selectAll("circle")
    .data(data.nodes)
    .enter()
    .append("circle")
    .attr("r", 15)
    .attr("stroke", "green")
    .attr("stroke-width", 0.5)
    .style("fill", "blue")

  const link = svg
    .selectAll("path.link")

  simulation.on("tick", () => {
    node
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
  })
})