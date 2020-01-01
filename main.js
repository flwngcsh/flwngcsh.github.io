(async () => {
  const dataUrl = './cars.csv';
  const padding = {
    top: 20,
    right: 30,
    bottom: 30,
    left: 50
  }
  let mainData = []
  let dataByYear = [];
  let dataByRate = [];
  let colorAry = ['#4daf4a', '#377eb8', '#ff7f00', '#984ea3', '#e41a1c', '#fa0', '#0af', '#0fa'];

  await d3.csv(dataUrl, function (data) {
    mainData.push(data);
  });

  dataByYear = getData(mainData, 'YEAR')
  dataByYear = formatAry(dataByYear, 'name', 'value');
  drawBarChart(dataByYear, 'svg');

  dataByRate = getData(mainData, 'Make');
  dataByRate = getRate(dataByRate);
  dataByRate = formatAry(dataByRate, 'name', 'value');
  drawPieChart(dataByRate, 'svg2');

  dataByKW = getDataByAvg(mainData)
  dataByKW = formatAry(dataByKW, 'name', 'value')
  dataByKW = sortAry(dataByKW, 'value');
  drawBarChart(dataByKW, 'svg3');

  function drawPieChart(dataset, domId) {
    let svg = d3.select(`#${domId}`),
      width = parseInt(svg.attr("width")),
      height = parseInt(svg.attr("height")),
      radius = Math.min(width, height) / 2;
    let g = svg.append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


    let pie = d3.pie().value(function (d) {
      return d.value;
    });

    let path = d3.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

    let label = d3.arc()
      .outerRadius(radius)
      .innerRadius(radius - 80);

    let arc = g.selectAll(".arc")
      .data(pie(dataset))
      .enter()
      .append("g")
      .attr("class", "arc");

    arc.append("path")
      .attr("d", path)
      .attr("fill", function (d, i) {
        return colorAry[i]
      });

    let text = arc.append('text')
      .attr("transform", function (d) {
        d.innerRadius = 0;
        d.outerRadius = radius;
        return "translate(" + label.centroid(d) + ")";
      })
      .attr("text-anchor", "middle")
      .attr('font-size', '10px')
      .text(function (d) {
        return d.data.name;
      })

    text.append('tspan')
      .attr('y', '1.2em')
      .attr('x', 0)
      .style('font-weight', 'bold')
      .text(d => `${d.data.value}%`);


    svg.append("g")
      .attr("transform", "translate(" + (width / 2 + 100) + "," + (height - 25) + ")")
      .append("text")
      .text("各廠牌電動車占比")
      .attr("class", "title")
  }

  function drawBarChart(dataset, domId) {
    let svg = d3.select(`#${domId}`);
    let chartArea = {
      width: parseInt(svg.style('width')) - padding['left'] - padding['right'],
      height: parseInt(svg.style('height')) - padding['top'] - padding['bottom']
    }

    let yScale = d3.scaleLinear()
      .domain([0, d3.max(dataset, (d, i) => {
        return d.value + 10
      })])
      .range([chartArea['height'], 0]).nice();

    let xScale = d3.scaleBand()
      .domain(dataset.map(d => d.name))
      .range([0, chartArea['width']])
      .padding(.3);

    // x軸
    let xAxis = svg.append('g')
      .classed('xAxis', true)
      .attr('transform', `translate(${padding.left}, ${chartArea.height+padding.top})`)
      .call(d3.axisBottom(xScale));

    // y軸
    let yAxisFn = d3.axisLeft(yScale);
    let yAxis = svg.append('g')
      .classed('yAxis', true)
      .attr('transform', `translate(${padding.left}, ${padding.top})`);
    yAxisFn(yAxis);

    // let grid = svg.append('g')
    //   .attr('class', 'grid')
    //   .attr('transform', `translate(${padding.left}, ${padding.top})`)
    //   .call(d3.axisLeft(yScale).tickSize(-(chartArea.width))
    //     .tickFormat(""))

    let rectGrp = svg.append('g')
      .attr('transform', `translate(${padding.left}, ${padding.top})`);

    rectGrp.selectAll('rect')
      .data(dataset)
      .enter()
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', function (d, i) {
        return chartArea.height - yScale(d.value)
      })
      .attr('x', function (d, i) {
        return xScale(d.name)
      })
      .attr('y', function (d, i) {
        return yScale(d.value)
      })
      .attr('fill', function (d, i) {
        return colorAry[i];
      })
      .attr("stroke", "black");

    rectGrp.selectAll('g')
      .data(dataset)
      .enter()
      .append('text')
      .text(function (d) {
        return d.value;
      })
      .attr('text-anchor', 'text-middle')
      .attr('x', function (d, i) {
        let value = (d.value).toString().length;
        let n = 0.5;
        if (value >= 3 && value < 5) n = 0.68
        if (value >= 6) n = 0.9
        if (value === 2) n = 0.65;
        return xScale(d.name) + xScale.bandwidth() - xScale.bandwidth() * n;
      })
      .attr('y', function (d) {
        return yScale(d.value);
      })
      .attr('fill', function (d, i) {
        return '#000';
      })
  }

  function getData(mainData, prop) {
    return mainData.reduce(function (prev, curr, index, ary) {
      if (!prev.hasOwnProperty(curr[prop])) {
        prev[curr[prop]] = {
          value: 1
        }
      } else {
        prev[curr[prop]].value += 1
      }
      return prev;
    }, {});
  }

  function getDataByAvg(mainData) {
    return mainData.reduce((prev, curr) => {
      if (!prev.hasOwnProperty(curr.Size)) {
        prev[curr.Size] = {
          qty: 1,
          kw: parseInt(curr['(kW)'])
        };
      } else {
        prev[curr.Size].qty += 1;
        prev[curr.Size].kw += parseInt(curr['(kW)'])
      }
      prev[curr.Size]['value'] = (prev[curr.Size].kw / prev[curr.Size].qty).toFixed(2) * 1
      return prev;

    }, [])
  }

  function formatAry(temp, a, b) {
    let ary = [];
    for (let i in temp) {
      let obj = {};
      obj[a] = i;
      obj[b] = temp[i][b];
      ary.push(obj)
    }
    return ary;
  }

  function sortAry(ary, prop) {
    return ary.sort((a, b) => {
      return a[prop] > b[prop] ? 1 : a[prop] < b[prop] ? -1 : 0;
    })
  }

  function getRate(obj) {
    for (let i in obj) {
      obj[i].value = ((obj[i].value / mainData.length) * 100).toFixed(2)
    }
    return obj;
  }

})();