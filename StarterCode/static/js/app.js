console.log('app', d3);
let data;
const metadataElement = document.querySelector('#sample-metadata');
const select = document.querySelector('#selDataset');
const bar = document.querySelector('#bar');
const bubble = document.querySelector('#bubble');

init();

function optionChanged(value) {
  console.log(value)
  const metaItem = data.metadata.find(item => item.id == value);
  const sampleItem = data.samples.find(item => item.id == value);

  renderMetaData(metaItem);
  bar.innerHTML = '';
  const Bar = renderBarChart(sampleItem);
  console.log(Bar);
  bar.appendChild(Bar);
  const Bubble = renderBubbleChart(sampleItem);
  bubble.innerHTML = '';

  bubble.appendChild(Bubble);

}

function renderMetaData(data) {
  metadataElement.innerHTML = `
    <p>id: ${data.id}</p>
    <p>ethnicity: ${data.ethnicity}</p>
    <p>gender: ${data.gender}</p>
    <p>age: ${data.age}</p>
    <p>location: ${data.location}</p>
    <p>wfreq: ${data.wfreq}</p>
  `;
}

function renderBarChart(barData) {
  const data = barData.otu_ids.reduce((acc, cur, index) => {
    acc.push({
      name: cur,
      value: barData.sample_values[index]
    })
    return acc;
  }, [])
  data.columns = ["otu_ids", "otu_labels"];
  const barHeight = 25;

  const margin = ({top: 30, right: 0, bottom: 10, left: 80});
  const height = Math.ceil((data.length + 0.1) * barHeight) + margin.top + margin.bottom;
  const width = 600;
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height]);

  const yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickFormat(i => `OTU ${data[i].name}`).tickSizeOuter(0));

  const xAxis = g => g
    .attr("transform", `translate(0,${margin.top})`)
    .call(d3.axisTop(x).ticks(width / 80))
    .call(g => g.select(".domain").remove());

  const y = d3.scaleBand()
    .domain(d3.range(data.length))
    .rangeRound([margin.top, height - margin.bottom])
    .padding(0.1);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([margin.left, width - margin.right]);

  svg.append("g")
    .attr("fill", "steelblue")
    .selectAll("rect")
    .data(data)
    .join(
      enter => enter.append("rect"),
      update => update
        .attr("class", "update"),
      exit => exit.remove()
    )
    .attr("x", x(0))
    .attr("y", (d, i) => y(i))
    .attr("width", d => x(d.value) - x(0))
    .attr("height", y.bandwidth());

  svg.append("g")
    .attr("fill", "white")
    .attr("text-anchor", "end")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("x", d => x(d.value))
    .attr("y", (d, i) => y(i) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("dx", -4)
    .text(d => d.value)
    .call(text => text.filter(d => x(d.value) - x(0) < 20) // short bars
      .attr("dx", +4)
      .attr("fill", "black")
      .attr("text-anchor", "start"));

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);

  return svg.node();
}

function renderBubbleChart(bubbleData) {
  const data = bubbleData.otu_ids.reduce((acc, cur, index) => {
    acc.push({
      x: cur,
      y: bubbleData.sample_values[index],
      weight: bubbleData.sample_values[index],
    })
    return acc;
  }, []);

  const margin = ({top: 20, right: 20, bottom: 35, left: 40});
  const height = 560;

  const width = 800;

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height]);

  const grid = g => g
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.1)
    .call(g => g.append("g")
      .selectAll("line")
      .data(x.ticks())
      .join("line")
      .attr("x1", d => 0.5 + x(d))
      .attr("x2", d => 0.5 + x(d))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom))
    .call(g => g.append("g")
      .selectAll("line")
      .data(y.ticks())
      .join("line")
      .attr("y1", d => 0.5 + y(d))
      .attr("y2", d => 0.5 + y(d))
      .attr("x1", margin.left)
      .attr("x2", width - margin.right));

  const yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", -margin.left)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("↑ sample_values"));
  const xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80, ","))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", width)
      .attr("y", margin.bottom - 4)
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
      .text("otu_ids →"))

  const color = d3.scaleOrdinal(data.map(d => d.x), d3.schemeCategory10).unknown("black");

  const radius = d3.scaleSqrt([0,  d3.max(data, d => d.x)], [0, width / 24]);

  const y = d3.scaleLinear([d3.min(data, d => d.y), d3.max(data, d => d.y)], [height - margin.bottom, margin.top]);
  const x = d3.scaleLog([d3.min(data, d => d.x), d3.max(data, d => d.x)], [margin.left, width - margin.right]);

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);

  svg.append("g")
    .call(grid);

  svg.append("g")
    .attr("stroke", "black")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .sort((a, b) => d3.descending(a.y, b.y))
    .attr("cx", d => x(d.x))
    .attr("cy", d => y(d.y))
    .attr("r", d => radius(d.weight))
    .attr("fill", d => color(d.x))
    .call(circle => circle.append("title")
      .text(d => [d.x, d.y].join("\n")));

  return svg.node();
}

async function init() {
  data = await d3.json('./samples.json');
  console.log(data);
  const selectOptionsStr = data.names.map(item => `<option>${item}</option>`).join('');
  select.innerHTML = selectOptionsStr;

}

