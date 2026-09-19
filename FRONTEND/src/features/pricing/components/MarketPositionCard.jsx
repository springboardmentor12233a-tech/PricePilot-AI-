import React from 'react';
import PricePositionCard from './PricePositionCard';

/**
 * MarketPositionCard
 * Descriptive observation: "Below Market", "At Market", "Above Market".
 * Strictly neutral UI per requirements.
 */
export default function MarketPositionCard(props) {
  return <PricePositionCard {...props} />;
}
