console.log('Hello Electrorating');

window.addEventListener('resize', update);

let formatedData,
	rawData,
	dataByYear,
	chartData,
	hierachy,
	hierarchyArrs = {
		root: [],
		parents: [],
		companies: [],
	},
	colors = [
		'cornflowerblue', // 0: "ARGENTINA"
		'olive', // 1: "BELIZE"
		'goldenrod', // 2: "COSTA RICA"
		'mediumseagreen', // 3: "ECUADOR"
		'lightgreen', // 4: "EL SALVADOR"
		'forestgreen', // 5: "GUYANA"
		'indigo', // 6: "JAMAICA"
		'salmon', // 7: "MEXICO"
		'blue', // 8: "PANAMA"
		'tan', // 9: "BOLIVIA"
		'green', // 10: "BRASIL"
		'coral', // 11: "PARAGUAY"
		'peru', // 12: "PERU"
		'lightcoral', // 13: "REPUBLICA DOMINICANA"
		'crimson', // 14: "CHILE"
		'darkorange', // 15: "COLOMBIA"
		'royalblue', // 16: "URUGUAY"
	],
	colorsInterpol,
	selectedProp = 'year',
	selectedYear = 2014,
	theme = 'All',
	indicator = 'ACTIVOS CORRIENTES',
	allCountries,
	currentCountries,
	allIndicators,
	interval,
	time = 2000,
	svg,
	hideThreshold = 0.001,
	stratify,
	treemap;

let margins = { top: 100, left: document.body.innerWidth / 20 };
let width = document.body.innerWidth - margins.left * 2;
let height = document.body.innerHeight - margins.top * 2;

// add jQuery UI slider
$('#date-slider').slider({
	range: false,
	max: 2020,
	min: 2000,
	step: 1,
	slide: (e, ui) => {
		console.log({ e, ui, v: ui.value });
		selectedYear = ui.value;
		wrangleData(rawData);
		update();
	},
	value: selectedYear,
});

$('button#play').on('click', e => {
	$('button#pause').show();
	$('button#play').hide();
	play();
});
$('button#pause').on('click', e => {
	console.log(e);
	$('button#pause').hide();
	$('button#play').show();
	pause();
});
$('button#reset').on('click', e => {
	reset();
});
$('select#theme').on('change', e => {
	console.log(e.target.value);
	theme = e.target.value;
	wrangleData(rawData);
	update();
});
$('select#indicator').on('change', e => {
	console.log(e.target.value);
	indicator = e.target.value;
	wrangleData(rawData);
	update();
});

function play() {
	function step() {
		selectedYear = selectedYear === 2020 ? 2000 : selectedYear + 1;
		$('#date-slider').value = selectedYear;
		wrangleData(rawData);
		update();
	}
	step();
	interval = setInterval(step, time);
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

	rawData = data;

	// prettier-ignore
	allCountries = Array.from(new Set([...rawData.map(item => item['UTILITY_Country'])]));
	allIndicators = new Set([...rawData.map(item => item['INDICATOR_Name'])]);

	['All'].concat(Array.from(allIndicators)).forEach(indicator => {
		d3.select('select#indicator')
			.append('option')
			.attr('value', indicator)
			.text(indicator);
	});

	$('select#indicator').val('ACTIVOS CORRIENTES');

	svg = d3.select('svg');

	g = svg.append('g');

	stratify = d3
		.stratify()
		.id(d => d.id)
		.parentId(d => d.parent);

	treemap = (width, height) =>
		d3
			.treemap()
			.size([width, height])
			.paddingOuter(1)
			.paddingInner(1)
			.paddingTop(1);

	wrangleData(rawData);
	update();
})();

function update() {
	setDims();
	svg.attr('width', width).attr('height', height);

	g.attr('width', width).attr('height', height);

	let root = stratify(hierachy)
		.sum(d => {
			let isLeaf = d.parent && d.parent !== 'Root';
			return isLeaf ? d.value : 0;
		})
		.sort((a, b) => b.value - a.value);

	treemap(width, height)(root);

	// ----------------- TEXT ----------------- ///

	d3.select('#chart-area')
		.selectAll('.text-div')
		.data([...root.leaves()])
		.join('div')
		.attr('class', 'text-div')
		.style('width', d => d.x1 - d.x0 + 'px')
		.style('height', d => d.y1 - d.y0 + 'px')
		.style('display', 'none')
		.transition()
		.duration(400)
		.style('display', d => {
			// console.log(allSum);
			return d.value > allSum * hideThreshold ? 'block' : 'none';
		})
		.attr('title', d => d.id)
		.style('left', d => d.x0 + 'px')
		.style('top', d => d.y0 + 'px')
		.style('width', d => d.x1 - d.x0 + 'px')
		.style('height', d => d.y1 - d.y0 + 'px')
		.style('text-align', d => (d.depth === 1 ? 'center' : 'start'))
		.style('background', d => {
			// console.log(d);
			if (d.depth === 1) {
				let c = d3.color(colors[allCountries.indexOf(d.id)]);
				c.opacity = 0.4;
				return c;
			}

			// d => colors[allCountries.indexOf(d.parent.id) % colors.length]
		})
		.text(d => {
			// console.log(this);
			// console.log(this.style.width, d);
			if (!d.value) return '';

			const txts = {
				0: '',
				1: '',
				2: `${d.id.split(' ')[0]} ${d.id.split(' ')[1] || ''} ${format(
					d.value
				)}`,
			};
			return txts[d.depth];
		});

	// ----------------- RECTS --------------------------- //

	d3.select('g')
		.selectAll('.node')
		.data([...root.leaves()])
		.join('rect')
		.attr('class', d => {
			return d.depth === 1 ? 'node parent' : 'node';
		})
		.attr('width', d => d.x1 - d.x0 + 'px')
		.attr('height', d => d.y1 - d.y0 + 'px')
		.transition()
		.duration(400)
		.attr('title', d => d.id)
		.style('x', d => d.x0 + 'px')
		.style('y', d => d.y0 + 'px')
		.attr('width', d => d.x1 - d.x0 + 'px')
		.attr('height', d => d.y1 - d.y0 + 'px')
		.attr('opacity', d => 0.7)
		.attr('fill', (d, i, e) =>
			d.parent
				? colors[allCountries.indexOf(d.parent.id) % colors.length]
				: '#cdcdcd'
		);
	// ------------------ LEGENDS ------------------ //

	d3.select('#countries-legends')
		.selectAll('div')
		.data(allCountries)
		.enter()
		.append('div')
		.attr('class', d =>
			currentCountries.includes(d)
				? 'legend-container enabled'
				: 'legend-container disabled'
		)
		.text(d => d)
		.append('div')
		.attr('class', 'legend-btn');

	d3.select('#countries-legends')
		.selectAll('div.legend-container')
		.data(allCountries)
		.attr('class', d =>
			currentCountries.includes(d)
				? 'legend-container enabled'
				: 'legend-container disabled'
		);

	d3.select('#countries-legends')
		.selectAll('div.legend-btn')
		.data(allCountries)
		.transition()
		.style('background', d => {
			// console.log(, d);
			return currentCountries.includes(d)
				? d3.color(colors[allCountries.indexOf(d)])
				: '#cdcdcd';
		});

	$('h1#year-display').text(selectedYear);
	$('#date-slider').slider('value', selectedYear);

	$('#companies-info').text(
		`${indicator === 'All' ? 'Ocurrencias: ' : 'Companias: '} ${
			hierarchyArrs.companies.length
		}`
	);
	$('#countries-info').text(`Países: ${hierarchyArrs.parents.length}`);
	$('#total-info').text(`Valor Acumulado: ${format(allSum)}`);
}

function reduceBy(key, data) {
	return data.reduce((acc, player) => {
		acc[player[key]]
			? (acc[player[key]] += player.value)
			: (acc[player[key]] = player.value);
		return acc;
	}, {});
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

function setDims() {
	margins = { top: 100, left: window.innerWidth / 20 };
	width = window.innerWidth - margins.left * 2;
	height = window.innerHeight - margins.top * 2;

	console.log({ height, width, left: margins.left, top: margins.top });
}

function wrangleData(data) {
	formatedData = data.map(item => ({
		value: Number(item['FACT_INDICATOR_Value_USD']),
		localValue: Number(item['FACT_INDICATOR_Value_Local']),
		year: Number(item['TIME_Year']),
		country: item['UTILITY_Country'],
		company: item['UTILITY_Name'],
		indicator: item['INDICATOR_Name'],
		theme: item['INDICATOR_Theme'],
	}));

	dataByYearObj = d3
		.nest()
		.key(d => d.year)
		.object(formatedData);

	chartData = dataByYearObj[selectedYear]
		// .filter(item => (theme !== 'All' ? item.theme === theme : true))
		.filter(item =>
			indicator !== 'All' ? item.indicator === indicator : true
		)
		.filter(item => item.value !== 0);

	allSum = chartData.reduce((acc, item) => (acc += Math.abs(item.value)), 0);

	hierarchyArrs = {
		root: [{ id: 'Root', parent: '', value: allSum }],
		parents: Object.entries(reduceBy('country', chartData)).map(
			([k, v]) => ({ id: k, value: v, parent: 'Root' })
		),
		companies: chartData.map(item => ({
			id: item.company,
			value: item.value,
			parent: item.country,
		})),
	};

	hierachy = hierarchyArrs.root
		.concat(hierarchyArrs.parents)
		.concat(hierarchyArrs.companies);

	currentCountries = hierarchyArrs.parents.map(item => item.id);

	console.log({
		// chartData,
		// allSum,
		// hierarchyArrs,
		// hierachy,
		// allCountries,
		// hideThreshold,
		currentCountries,
	});
}
