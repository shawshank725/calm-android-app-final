import { ShapeTemplate } from "@/types/ShapeTemplateType";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const shapes: ShapeTemplate[] = [
  {
    id: 1,
    name: 'Square',
    path: 'M40,40 L160,40 L160,160 L40,160 Z', // simple square
    strokeWidth: 2,
    icon: <MaterialCommunityIcons name="square-outline" size={24} color="black" />
  },
  {
    id: 2,
    name: 'Circle',
    path: 'M100,100 m-60,0 a60,60 0 1,0 120,0 a60,60 0 1,0 -120,0', // circle centered at (100,100)
    strokeWidth: 2,
    icon: <MaterialCommunityIcons name="circle-outline" size={24} color="black" />
  },
  {
    id: 3,
    name: 'Triangle',
    path: 'M100,40 L160,160 L40,160 Z', // equilateral-like triangle
    strokeWidth: 2,
    icon: <MaterialCommunityIcons name="triangle-outline" size={24} color="black" />
  },
  {
    id: 4,
    name: 'Rectangle',
    path: 'M40,60 L160,60 L160,140 L40,140 Z', // rectangle
    strokeWidth: 2,
    icon: <MaterialCommunityIcons name="rectangle-outline" size={24} color="black" />
  },
];
