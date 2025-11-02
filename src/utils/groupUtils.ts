import { DesignElement } from '../types/design';

export const createGroup = (elements: DesignElement[], selectedIds: string[]): DesignElement[] => {
  const selectedElements = elements.filter(el => selectedIds.includes(el.id));
  
  if (selectedElements.length < 2) return elements;

  // Calculate group bounds
  const minX = Math.min(...selectedElements.map(el => el.x));
  const minY = Math.min(...selectedElements.map(el => el.y));
  const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
  const maxY = Math.max(...selectedElements.map(el => el.y + el.height));

  const groupId = `group-${Date.now()}`;
  
  // Create group element
  const group: DesignElement = {
    id: groupId,
    type: 'group',
    name: 'Group',
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fill: 'transparent',
    stroke: 'transparent',
    strokeWidth: 0,
    borderRadius: 0,
    shadow: { blur: 0, color: 'transparent', x: 0, y: 0 },
    children: selectedElements.map(el => ({
      ...el,
      x: el.x - minX,
      y: el.y - minY,
      parentId: groupId
    }))
  };

  // Remove selected elements and add group
  const remainingElements = elements.filter(el => !selectedIds.includes(el.id));
  return [...remainingElements, group];
};

export const ungroupElements = (elements: DesignElement[], groupId: string): DesignElement[] => {
  const group = elements.find(el => el.id === groupId && el.type === 'group');
  
  if (!group || !group.children) return elements;

  // Convert children back to absolute positions
  const ungroupedChildren = group.children.map(child => ({
    ...child,
    x: child.x + group.x,
    y: child.y + group.y,
    parentId: undefined
  }));

  // Remove group and add children
  const remainingElements = elements.filter(el => el.id !== groupId);
  return [...remainingElements, ...ungroupedChildren];
};

export const getAllElementsFlat = (elements: DesignElement[]): DesignElement[] => {
  const result: DesignElement[] = [];
  
  elements.forEach(element => {
    if (element.type === 'group' && element.children) {
      result.push(element);
      result.push(...getAllElementsFlat(element.children));
    } else {
      result.push(element);
    }
  });
  
  return result;
};

export const updateElementInGroup = (
  elements: DesignElement[],
  elementId: string,
  updates: Partial<DesignElement>
): DesignElement[] => {
  return elements.map(element => {
    if (element.id === elementId) {
      return { ...element, ...updates };
    }

    if (element.type === 'group' && element.children) {
      return {
        ...element,
        children: updateElementInGroup(element.children, elementId, updates)
      };
    }

    return element;
  });
};

export const findParentGroup = (
  elements: DesignElement[],
  childId: string
): DesignElement | null => {
  for (const element of elements) {
    if (element.type === 'group' && element.children) {
      // Check if this child is directly in this group
      const hasChild = element.children.some(child => child.id === childId);
      if (hasChild) {
        return element;
      }

      // Check nested groups
      const parentInChildren = findParentGroup(element.children, childId);
      if (parentInChildren) {
        return parentInChildren;
      }
    }
  }
  return null;
};