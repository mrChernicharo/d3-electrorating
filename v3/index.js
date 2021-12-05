console.log('Hello Electrorating');

window.addEventListener('resize', resize);

let formatedData,
	rawData,
	dataByYear,
	chartData,
	selectedProp = 'year',
	selectedYear = 2020,
	interval,
	width,
	height,
	margins,

const [playBtn, pauseBtn, resetBtn] = [
	$('button#play'),
	$('button#pause'),
	$('button#reset'),
];

playBtn.on('click', e => {
	pauseBtn.show();
	playBtn.hide();
	play();
});
pauseBtn.on('click', e => {
	console.log(e);
	pauseBtn.hide();
	playBtn.show();
	pause();
});
resetBtn.on('click', e => {
	reset();
});

d3.dsv(';', '../electrorating_indicadores_financieros.csv').then(data => {
	console.log(data);
	rawData = data;
	wrangleData(rawData);
	update();
});

function play() {
	interval = setInterval(() => {
		selectedYear = selectedYear === 2020 ? 2000 : selectedYear + 1;
		wrangleData(rawData);
		update();
	}, 500);
}

function pause() {
	clearInterval(interval);
}

function reset() {
	selectedYear = 2020;
}

function update() {
	setDims();
	console.log(selectedYear, chartData);

	const svg = d3
		.select('svg')
		.attr('width', width)
		.attr('height', height)
		.attr('transform', `translate(${margins.left}, 0)`);

	const g = svg
		.append('g')
		.attr('transform', `translate(${margins.left}, 0)`);

	// scales
	const x = d3.scaleTime().range([margins.left, width - margins.left * 2]);
	const y = d3.scaleLinear().range([height, 0]);

	// axis generators
	const xAxisCall = d3.axisBottom();
	const yAxisCall = d3
		.axisLeft()
		.ticks(6)
		.tickFormat(d => `${parseInt(d / 1000)}k`);

	// axis groups
	const xAxis = g
		.append('g')
		.attr('class', 'x axis')
		.attr('transform', `translate(0, ${height - 40})`);

	const yAxis = g.append('g').attr('class', 'y axis');

	xAxisCall.scale(x);
	xAxis.transition().call(xAxisCall);
	// yAxisCall.scale(y)
	// yAxis.transition(t).call(yAxisCall.tickFormat(formatAbbreviation))

	// const x = d3
	// 	.scaleLinear()
	// 	.domain(d3.extent(chartData, d => d.value))
	// 	.range([0, width]);

	// const xAxisCall = d3.axisBottom().call(xAxisG);
}

function dataFormat(data) {
	return data.map(item => ({
		value: Number(item['FACT_INDICATOR_Value_USD']),
		localValue: Number(item['FACT_INDICATOR_Value_Local']),
		year: Number(item['TIME_Year']),
		country: item['UTILITY_Country'],
		company: item['UTILITY_Name'],
		indicator: item['INDICATOR_Name'],
	}));
}

function reduceBy(key, data) {
	return data.reduce((acc, player) => {
		acc[player[key]]
			? (acc[player[key]] += player.value)
			: (acc[player[key]] = player.value);
		return acc;
	}, {});
}

function format(val) {
	return d3.format('~s')(val * 1_000_000);
}

function resize(e) {
	update();
}

function setDims() {
	margins = { top: 100, left: window.innerWidth / 20 };
	width = window.innerWidth - margins.left * 2;
	height = window.innerHeight - margins.top * 2;

	console.log({ height, width, left: margins.left, top: margins.top });
}

function wrangleData(data) {
	formatedData = dataFormat(data);
	dataByYearObj = d3
		.nest()
		.key(d => d.year)
		.object(formatedData);

	chartData = dataByYearObj[selectedYear];
}

// function getFilteredData(formatedData) {
// 	const allSum = formatedData.reduce((a, b) => (a += b.value), 0);

// 	const reducedByPropObj = reduceBy(selectedProp, formatedData);
// 	console.log({ reducedByPropObj });

// 	byPropArr = Object.entries(reducedByPropObj).map(([k, v]) => ({
// 		id: k,
// 		value: v,
// 		parent: 'Root',
// 	}));
// 	console.log({ byPropArr });

// 	const companysByPropArr = formatedData.map(company => {
// 		const parentNode = byPropArr.find(
// 			node => node.id === String(company[selectedProp])
// 		);
// 		return {
// 			id: company.company,
// 			value: company.value,
// 			parent: parentNode.id,
// 		};
// 	});
// 	// items = byProp.map(item => item.id);
// 	const hierarchy = [{ id: 'Root', parent: '', value: allSum }]
// 		.concat(byPropArr)
// 		.concat(companysByPropArr);

// 	console.log({ reducedByPropObj, byPropArr, allSum, hierarchy });

// 	return hierarchy;
// }
