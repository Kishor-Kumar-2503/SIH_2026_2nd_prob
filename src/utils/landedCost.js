export function calculateLandedCost({
  cargoQuantity,
  fobPrice,
  freightRate,
  portCharges,
  demurrage,
  financingCost,
}) {
  const procurementCost = cargoQuantity * fobPrice;

  const freightCost = cargoQuantity * freightRate;

  const operationalCost =
    portCharges + demurrage;

  const totalLandedCost =
    procurementCost +
    freightCost +
    operationalCost +
    financingCost;

  const landedCostPerTonne =
    totalLandedCost / cargoQuantity;

  return {
    procurementCost,
    freightCost,
    operationalCost,
    financingCost,
    totalLandedCost,
    landedCostPerTonne,
  };
}