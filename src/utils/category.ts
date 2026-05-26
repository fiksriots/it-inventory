export function formatCategoryName(category: any, allCategories: any[]): string {
  if (!category) return "";
  const parts = [category.name];
  let current = category;
  const visited = new Set<string>([category.id]);
  
  while (current.parent_id) {
    if (visited.has(current.parent_id)) break;
    visited.add(current.parent_id);
    
    const parent = allCategories.find(c => c.id === current.parent_id);
    if (!parent) break;
    parts.unshift(parent.name);
    current = parent;
  }
  
  return parts.join(" › ");
}
