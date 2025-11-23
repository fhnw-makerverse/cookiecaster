import Edge from '../../src/api/graph/Edge.js'
import { beforeEach, test, expect, jest } from '@jest/globals';


let edge;
let from, to;

const registerMock = jest.fn().mockImplementation(edge => edge);
const unregisterMock = jest.fn().mockImplementation(edge => edge);

beforeEach(() => {
    registerMock.mockClear();
    unregisterMock.mockClear();
    from = {
        id: 1,
        pos: {x: 2, y: 5},
        registerAdjacentEdge: registerMock,
        unregisterAdjacentEdge: unregisterMock,
    };
    to = {
        id: 2,
        pos: {x: -3, y: 1},
        registerAdjacentEdge: registerMock,
        unregisterAdjacentEdge: unregisterMock,
    };

    edge = new Edge(1, from, to);
});

test("properties", () => {
    expect(edge.id).toBe(1);
    expect(edge.from.id).toBe(1);
    expect(edge.to.id).toBe(2);
    expect(edge.q).toEqual({x: -0.5, y: 3});
    expect(registerMock).toHaveBeenCalledTimes(2);
});

test("properties2", () => {
    const edge2 = new Edge(2, from, to, {x: 2, y: 4});
    expect(edge2.id).toBe(2);
    expect(edge2.from.id).toBe(1);
    expect(edge2.to.id).toBe(2);
    expect(edge2.q).toEqual({x: 2, y: 4});
    expect(registerMock).toHaveBeenCalledTimes(4);
});

test("removeFromAdjacentNode", () => {
    edge.removeFromAdjacentNode();
    expect(unregisterMock).toHaveBeenCalledTimes(2);
});

test("getOtherNode", () => {
    expect(edge.getOtherNode(from)).toBe(to);
    expect(edge.getOtherNode(to)).toBe(from);
    expect(edge.getOtherNode({id: 3})).toBeUndefined();
});

test("asSvgPath", () => {
    expect(edge.asSvgPath()).toEqual("M 2 5 Q -0.5 3 -3 1");
});
