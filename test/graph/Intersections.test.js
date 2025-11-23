import intersections from '../../src/api/Intersections';
import { test, expect } from '@jest/globals';


test("empty", () => {
    expect(intersections([])).toEqual([]);
});

test("one segment no sort", () => {
    expect(intersections([
        [[1, 2], [3, 4]]
    ])).toEqual([]);
});

test("one segment sort", () => {
    expect(intersections([
        [[1, 2], [-3, 4]]
    ])).toEqual([]);
});

test("two segment same", () => {
    expect(intersections([
        [[1, 2], [3, 4]],
        [[1, 2], [3, 4]]
    ])).toEqual([]);
});

test("two segment parallel", () => {
    expect(intersections([
        [[1, 2], [3, 4]],
        [[1, 4], [3, 6]]
    ])).toEqual([]);
});

test("two segment x moved", () => {
    expect(intersections([
        [[1, 2], [-3, 4]],
        [[-6, 0], [-3.5, -7.01]]
    ])).toEqual([]);
});

test("two segment same point", () => {
    expect(intersections([
        [[1, 2], [-3, 4]],
        [[-6, 0], [-3, 4]]
    ])).toEqual([]);
});

test("two segment no intersection", () => {
    expect(intersections([
        [[1, 2], [-3, 4]],
        [[-2, -1], [-0.1, 2.5]]
    ])).toEqual([]);
});

test("two segment intersection", () => {
    const i = intersections([
        [[1, 2], [-3, 4]],
        [[-1.5, -0.5], [1, 4.5]],
    ]);
    expect(i.length).toBe(1);
    expect(Math.abs(i[0][0])).toBeLessThan(1e-9);
    expect(Math.abs(i[0][1] - 2.5)).toBeLessThan(1e-9);
});