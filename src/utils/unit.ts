export function formatStock(
  quantity: number,
  unit: string = 'PCS',
  hasConversion: boolean = false,
  conversionUnit?: string,
  conversionRate: number = 1
): string {
  if (!hasConversion || !conversionUnit || conversionRate <= 1) {
    return `${quantity} ${unit}`;
  }
  
  // Ensure we are working with numbers
  const qty = Number(quantity) || 0;
  const rate = Number(conversionRate) || 1;
  
  const rolls = Math.floor(qty / rate);
  const remaining = qty % rate;
  
  const mainPart = rolls > 0 ? `${rolls} ${unit}` : '';
  const subPart = remaining > 0 ? `${remaining} ${conversionUnit}` : '';
  
  if (mainPart && subPart) {
    return `${mainPart} ${subPart} (${qty} ${conversionUnit})`;
  } else if (mainPart) {
    return `${mainPart} (${qty} ${conversionUnit})`;
  } else {
    return `${subPart || `0 ${conversionUnit}`}`;
  }
}

/**
 * Returns the label for the input depending on whether conversion is enabled.
 */
export function getInputUnitLabel(
  unit: string = 'PCS',
  hasConversion: boolean = false,
  conversionUnit?: string
): string {
  if (hasConversion && conversionUnit) {
    return conversionUnit;
  }
  return unit;
}
