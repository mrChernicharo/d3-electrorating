import path from 'path';
import fs from 'fs';

const rawData, jsonData, zeroUSDfiltered, zeroUSDDsv;

const filePath = '../electrorating_indicadores_financieros.csv';

const rawCsv = await fs.promises.readFile(filePath, 'utf-8', (err, d) => d);

jsonData = dsvToJSON(rawCsv, ';');

zeroUSDfiltered = jsonData.filter(
	item =>
		Number(item['FACT_INDICATOR_Value_USD']) === 0 &&
		Number(item['FACT_INDICATOR_Value_Local']) !== 0
);

zeroUSDDsv = JSONToDsv(zeroUSDfiltered, ';');

await fs.promises.writeFile('ouput.dsv', zeroUSDDsv, err => {
	if (err) console.log(err);
	else console.log('file writen');
});


function JSONToDsv(json, delim) {
	const headers = Object.keys(json[0]);
	const lines = json.slice(1);

	const res = [];
	res.push(headers.join(delim));

	lines.forEach(line => {
		res.push(Object.values(line).join(delim));
	});

	return res.join('\n');
}


function dsvToJSON(csv, delim) {
	const lines = csv.split('\n');
	const result = [];

	const headers = lines[0].split(delim);
	headers[headers.length - 1] = headers[headers.length - 1].slice(0, -1); // remove \r

	// console.log(headers);

	lines.forEach(l => {
		const obj = {};
		const line = l.split(delim);

		headers.forEach((h, i) => {
			obj[h] = line[i];
		});

		result.push({
			...obj,
			FACT_INDICATOR_Value_Local: String(
				Number(obj['FACT_INDICATOR_Value_Local'])
			),
		});
	});

	return result;
}
