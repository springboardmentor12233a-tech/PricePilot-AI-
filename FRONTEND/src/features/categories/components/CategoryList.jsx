import React from 'react';
import CategoryCard from './CategoryCard';
import EmptyState from '../../../components/EmptyState';
import { FolderTree, Plus } from 'lucide-react';

export default function CategoryList({ categories = [], onAddCategory }) {
  if (!categories || categories.length === 0) {
    return (
      <EmptyState
        icon={FolderTree}
        title="No categories yet"
        description="Create a category to organize your product catalog."
        actionText="Create Category"
        onAction={onAddCategory}
        actionIcon={Plus}
      />
    );
  }

  // Create a map for quick parent category lookup
  const categoryMap = new Map(categories.map((cat) => [String(cat.id), cat.name]));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          parentName={category.parent_id ? categoryMap.get(String(category.parent_id)) : null}
        />
      ))}
    </div>
  );
}
