import Node from '../../src/api/graph/Node.js';
import { beforeEach, test, expect, jest } from '@jest/globals';

let node, otherNode;

const mockGetOtherNode = jest.fn().mockImplementation(() => otherNode);

beforeEach(() => {
    mockGetOtherNode.mockClear();
    node = new Node(1, {x: 3, y: 5});
    otherNode = new Node(2, {x: -4, y: 1});
});

test("properties", () => {
    expect(node.id).toBe(1);
    expect(node.pos.x).toBe(3);
    expect(node.pos.y).toBe(5);
    expect(node.adjacent).toEqual([]);
});

test("registerAdjacent", () => {
    const edge = {id: 1};
    const edge2 = {id: 2};
    expect(node.registerAdjacentEdge(edge)).toBeTruthy();
    expect(node.registerAdjacentEdge(edge2)).toBeTruthy();
    expect(node.adjacent).toEqual([edge, edge2]);
});

test("registerAdjacent2", () => {
    const edge1 = {id: 1};
    const edge2 = {id: 2};
    const edge3 = {id: 3};
    expect(node.registerAdjacentEdge(edge1)).toBeTruthy();
    expect(node.registerAdjacentEdge(edge2)).toBeTruthy();
    expect(node.registerAdjacentEdge(edge3)).toBeFalsy();
    expect(node.adjacent).toEqual([edge1, edge2]);
});

test("unregisterAdjacentEmpty", () => {
    const edge = {id: 1};
    expect(node.unregisterAdjacentEdge(edge)).toBeFalsy();
    expect(node.adjacent).toEqual([]);
});

test("unregisterAdjacent", () => {
    const edge = {id: 1};
    const edge2 = {id: 2};
    node.registerAdjacentEdge(edge);
    node.registerAdjacentEdge(edge2);
    expect(node.unregisterAdjacentEdge(edge)).toBeTruthy();
    expect(node.adjacent).toEqual([edge2]);
});

test("getOtherNode", () => {
    const edge = {
        id: 1,
        getOtherNode: mockGetOtherNode
    };
    node.registerAdjacentEdge(edge);
    expect(node.getAdjacentNodes()).toEqual([otherNode]);
    expect(mockGetOtherNode).toHaveBeenCalledTimes(1);
});