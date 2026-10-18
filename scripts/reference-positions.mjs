import { writeFile } from 'node:fs/promises';
const fixtures=[];
for(const [id,command,toleranceAu] of [['earth','3',0.0002],['mars','4',0.001],['neptune','8',0.01]]) {
 const parameters={format:'json',COMMAND:`'${command}'`,CENTER:"'500@10'",EPHEM_TYPE:"'VECTORS'",TLIST:"'2451545.0,2462502.5'",OUT_UNITS:"'AU-D'",REF_PLANE:"'ECLIPTIC'",VEC_TABLE:"'2'",CSV_FORMAT:"'YES'",OBJ_DATA:"'NO'"};
 const source='https://ssd.jpl.nasa.gov/api/horizons.api?'+new URLSearchParams(parameters);
 const response=await(await fetch(source)).json();
 const records=response.result.split('$$SOE')[1]?.split('$$EOE')[0].trim().split('\n');
 if(!records)throw Error(response.error || 'Missing Horizons data');
 for(const record of records){const cells=record.split(',');fixtures.push({id,jd:Number(cells[0]),eclipticAu:cells.slice(2,5).map(Number),toleranceAu,source});}
}
await writeFile('tests/fixtures/horizons.json',JSON.stringify({retrieved:'2026-10-18',frame:'J2000 ecliptic, heliocentric, geometric, TDB',note:'Planet barycenters; tolerances account for the approximate Keplerian model, not solver precision.',fixtures},null,2));
console.log('Saved',fixtures.length,'independent reference positions');
