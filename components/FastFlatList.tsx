import React from 'react';
import { FlatList, FlatListProps } from 'react-native';

interface FastFlatListProps<T> extends FlatListProps<T> {
  data: T[];
  ultraFast?: boolean;
}

// Ultra-optimized FlatList component for maximum performance
export function FastFlatList<T>({
  data,
  ultraFast = true,
  removeClippedSubviews = true,
  maxToRenderPerBatch = 10,
  windowSize = 10,
  initialNumToRender = 15,
  updateCellsBatchingPeriod = 50,
  getItemLayout,
  disableVirtualization = false,
  ...props
}: FastFlatListProps<T>) {

  const optimizedProps = ultraFast ? {
    removeClippedSubviews,
    maxToRenderPerBatch,
    windowSize,
    initialNumToRender,
    updateCellsBatchingPeriod,
    getItemLayout,
    disableVirtualization,
  } : {};

  return (
    <FlatList
      data={data}
      {...optimizedProps}
      {...props}
    />
  );
}

export default FastFlatList;
