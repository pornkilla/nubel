import { Color, Vec3 } from "ogl-typescript";
import Polyline from "./polyline";
 
export interface PolylineOptions {
  points?: Vec3[];
  vertex?: string;
  fragment?: string;
  thickness?: number;
  color?: Color;
}

export type LinesI = {
  spring: number;
  friction: number;
  mouseVelocity: Vec3;
  mouseOffset: Vec3;
  points: Vec3[];
  polyline: Polyline;
}