import React from 'react';
import ProductSelector from './ProductSelector';

/**
 * ProductPricingSelector
 * Specialized product selector for Pricing Intelligence feature.
 * Re-exports ProductSelector with enterprise styling and accessible markup.
 */
export default function ProductPricingSelector(props) {
  return <ProductSelector {...props} />;
}
