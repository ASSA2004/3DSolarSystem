/** Water at 1 atmosphere; kJ/kg and °C. Approximate heat capacities from OpenStax. */
export const WATER = {
  melt: 0,
  boil: 100,
  solidCapacity: 2.1,
  liquidCapacity: 4.18,
  gasCapacity: 2.0,
  fusion: 334,
  vaporization: 2256,
};
export function phaseFromEnergy(energy: number, data = WATER) {
  const e = Math.max(
    -42,
    Math.min(
      energy,
      data.fusion +
        data.liquidCapacity * (data.boil - data.melt) +
        data.vaporization +
        80,
    ),
  );
  const boilingStart =
    data.fusion + data.liquidCapacity * (data.boil - data.melt);
  if (e < 0)
    return {
      temperature: data.melt + e / data.solidCapacity,
      solid: 1,
      liquid: 0,
      gas: 0,
      phase: "solid",
      plateau: false,
    };
  if (e < data.fusion) {
    const liquid = e / data.fusion;
    return {
      temperature: data.melt,
      solid: 1 - liquid,
      liquid,
      gas: 0,
      phase: "melting",
      plateau: true,
    };
  }
  if (e < boilingStart)
    return {
      temperature: data.melt + (e - data.fusion) / data.liquidCapacity,
      solid: 0,
      liquid: 1,
      gas: 0,
      phase: "liquid",
      plateau: false,
    };
  if (e < boilingStart + data.vaporization) {
    const gas = (e - boilingStart) / data.vaporization;
    return {
      temperature: data.boil,
      solid: 0,
      liquid: 1 - gas,
      gas,
      phase: "boiling",
      plateau: true,
    };
  }
  return {
    temperature:
      data.boil + (e - boilingStart - data.vaporization) / data.gasCapacity,
    solid: 0,
    liquid: 0,
    gas: 1,
    phase: "gas",
    plateau: false,
  };
}
export function energyAtTemperature(t: number, data = WATER) {
  if (t < 0) return t * data.solidCapacity;
  // At the boiling point, prepare liquid at the start of vaporization.
  if (t <= 100) return data.fusion + t * data.liquidCapacity;
  return (
    data.fusion +
    100 * data.liquidCapacity +
    data.vaporization +
    (t - 100) * data.gasCapacity
  );
}
