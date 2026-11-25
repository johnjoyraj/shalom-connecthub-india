import type { AreaUnit, PropertyPurpose, PropertyType } from '../types/property';

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  RENTAL_HOUSE: 'Rental House',
  APARTMENT_FLAT: 'Apartment / Flat',
  INDEPENDENT_HOUSE: 'Independent House / Villa',
  COMMERCIAL_SHOP: 'Commercial Shop / Showroom',
  OFFICE_SPACE: 'Office Space',
  HOSTEL_PG: 'Hostel / PG Accommodation',
  RESIDENTIAL_PLOT: 'Residential Plot',
  AGRICULTURAL_LAND: 'Agricultural / Farm Land',
};

export const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
  SQ_FT: 'Sq. Ft',
  SQ_YD: 'Sq. Yards',
  SQ_M: 'Sq. Meters',
  ACRE: 'Acres',
  HECTARE: 'Hectares',
  CENT: 'Cents',
  GUNTHA: 'Guntha',
};

export interface PropertyDynamicFormConfig {
  showBedroomsBathrooms: boolean;
  showFurnishing: boolean;
  showPgFields: boolean;
  showSalePrice: boolean;
  showResaleToggle: boolean;
  showRentAndDeposit: boolean;
  showLeaseDuration: boolean;
  allowedPurposes: PropertyPurpose[];
  allowedAreaUnits: AreaUnit[];
  defaultAreaUnit: AreaUnit;
}

export function getPropertyFormConfig(
  propertyType: PropertyType,
  purpose: PropertyPurpose
): PropertyDynamicFormConfig {
  const isResidentialRooms =
    propertyType === 'RENTAL_HOUSE' ||
    propertyType === 'APARTMENT_FLAT' ||
    propertyType === 'INDEPENDENT_HOUSE';

  const isPg = propertyType === 'HOSTEL_PG';

  let allowedPurposes: PropertyPurpose[] = ['RENT', 'SALE', 'LEASE'];
  if (propertyType === 'RENTAL_HOUSE' || propertyType === 'HOSTEL_PG') {
    allowedPurposes = ['RENT'];
  } else if (propertyType === 'RESIDENTIAL_PLOT') {
    allowedPurposes = ['SALE', 'LEASE'];
  } else if (propertyType === 'AGRICULTURAL_LAND') {
    allowedPurposes = ['SALE', 'LEASE'];
  }

  let allowedAreaUnits: AreaUnit[] = ['SQ_FT', 'SQ_M', 'SQ_YD'];
  let defaultAreaUnit: AreaUnit = 'SQ_FT';
  if (propertyType === 'RESIDENTIAL_PLOT') {
    allowedAreaUnits = ['SQ_FT', 'SQ_YD', 'CENT', 'SQ_M'];
    defaultAreaUnit = 'CENT';
  } else if (propertyType === 'AGRICULTURAL_LAND') {
    allowedAreaUnits = ['ACRE', 'HECTARE', 'CENT', 'GUNTHA'];
    defaultAreaUnit = 'ACRE';
  }

  return {
    showBedroomsBathrooms: isResidentialRooms,
    showFurnishing: isResidentialRooms || isPg || propertyType === 'OFFICE_SPACE',
    showPgFields: isPg,
    showSalePrice: purpose === 'SALE',
    showResaleToggle: purpose === 'SALE' && !isPg,
    showRentAndDeposit: purpose === 'RENT' || purpose === 'LEASE',
    showLeaseDuration: purpose === 'LEASE',
    allowedPurposes,
    allowedAreaUnits,
    defaultAreaUnit,
  };
}
