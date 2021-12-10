console.log('Hello Electrorating');

window.addEventListener('resize', resize);

let formatedData,
	rawData,
	dataByYear,
	chartData,
	selectedProp = 'year',
	selectedYear = 2020,
	interval,
	svg,
	x,
	y,
	xAxis,
	xAxisCall,
	yAxis,
	yAxisCall;

let margins = { top: 100, left: window.innerWidth / 20 };
let width = window.innerWidth - margins.left * 2;
let height = window.innerHeight - margins.top * 2;

const [playBtn, pauseBtn, resetBtn, yearDisplay] = [
	$('button#play'),
	$('button#pause'),
	$('button#reset'),
	$('#year-display'),
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
	selectedYear = 2000;
	wrangleData(rawData);
	update();
}

(async function init() {
	// prettier-ignore
	const data = await d3.dsv(';', '../data/electrorating_indicadores_financieros.csv');
	console.log(data);
	rawData = data;

	wrangleData(rawData);

	// scales

	y = d3.scaleLinear().range([height, 0]);

	svg = d3
		.select('svg')
		.attr('width', width)
		.attr('height', height)
		.attr('transform', `translate(${margins.left}, 0)`);

	g = svg.append('g').attr('transform', `translate(${margins.left}, 0)`);

	xAxisCall = d3.axisBottom().tickFormat(format);

	x = d3.scaleLinear();
	// axis groups
	xAxis = g
		.join('g')
		.attr('class', 'x axis')
		.attr('transform', `translate(0, ${height - 40})`);

	update();
})();

function update() {
	yearDisplay.text(selectedYear);
	setDims();

	console.log(selectedYear, chartData);

	svg.attr('width', width).attr('height', height);
	g.attr('width', width).attr('height', height);

	// prettier-ignore
	x
		.range([margins.left, width - margins.left * 2])
		.domain(d3.extent(chartData, d => d.value ));

	xAxisCall.scale(x).ticks(width > 700 ? 10 : width > 500 ? 7 : 4);

	xAxis
		.transition()
		.attr('transform', `translate(0, ${height - 40})`)
		.call(xAxisCall);
}

function dataFormat(data) {
	return data.map(item => ({
		value: Number(item['FACT_INDICATOR_Value_USD'] * 0.001),
		localValue: Number(item['FACT_INDICATOR_Value_Local'] * 0.001),
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
	return d3.format('.2s')(val);
}
function format(x) {
	const s = d3.format('.2s')(x);
	switch (s[s.length - 1]) {
		case 'G':
			return s.slice(0, -1) + 'B'; // billions
		case 'k':
			return s.slice(0, -1) + 'K'; // thousands
	}
	return s;
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
