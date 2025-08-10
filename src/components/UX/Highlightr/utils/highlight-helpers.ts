/**
 * Checks if a node is identiyable
 * @param {Element} node
 */
export interface IdentifyableNode extends Node {
	id: string;
	dataset: {
		hash: string;
		selectable: boolean;
	};
}

export function isIdentifyableNode(
	node: Node | null,
): node is IdentifyableNode {
	return Boolean(
		node &&
		"dataset" in node &&
		node.dataset &&
		typeof node.dataset === "object" &&
		"selectable" in node.dataset,
	);
}

export function getAnchestorIdentifyableNode(node) {
	if (isIdentifyableNode(node)) {
		return node;
	}
	if (node.parentNode) {
		return getAnchestorIdentifyableNode(node.parentNode);
	}
	return false;
}

/**
 * Walks nodes until callback returns something other than undefined
 * @param {Node} node
 * @param {function} func
 * @param {function} callback
 */
export function walkNodes(
	node: Node,
	func: (node: Node) => Node,
	callback: (node: Node) => any,
) {
	const ret = callback(node);
	if (ret === null || ret) return ret;
	return walkNodes(func(node), func, callback);
}

/**
 *
 * @param {Node} node
 */
export function prevNode(node) {
	while (node && !node.previousSibling) node = node.parentNode;
	if (!node) return null;
	return node.previousSibling;
}

/**
 *
 * @param {Node} node
 */
export function nextNode(node) {
	if (node.hasChildNodes()) {
		return node.firstChild;
	} else {
		while (node && !node.nextSibling) node = node.parentNode;
		if (!node) return null;
		return node.nextSibling;
	}
}

/**
 *
 * @param {Element} elem
 * @param {*} target
 */
export function nextUntil(elem: Element, target) {
	const siblings = [elem];
	if (elem === target) return siblings;
	// Get the next sibling element
	let lem = elem.nextElementSibling;

	// As long as a sibling exists
	while (lem) {
		// Otherwise, push it to the siblings array
		siblings.push(lem);
		// If we've reached our match, bail
		if (lem === target) break;
		// Get the next sibling element
		lem = lem.nextElementSibling;
	}
	return siblings;
}

export function isMarkable(selection: rangy.RangySelection) {
	return Boolean(
		!selection.isCollapsed &&
		getAnchestorIdentifyableNode(selection.anchorNode) &&
		getAnchestorIdentifyableNode(selection.focusNode),
	);
}

/**
 * Converts a range to data
 * @param {*} range
 */
export function rangeToData(range: rangy.RangyRange) {
	let startOffset = 0;
	let endOffset = 0;

	const startElement = walkNodes(range.startContainer, prevNode, (node) => {
		if (isIdentifyableNode(node.nextSibling)) {
			return node.nextSibling;
		}
		startOffset += node?.textContent?.length || 0;
	});

	const endElement = walkNodes(range.endContainer, prevNode, (node) => {
		if (isIdentifyableNode(node.nextSibling)) {
			return node.nextSibling;
		}
		endOffset += node?.textContent?.length || 0;
	});

	const markedElements =
		startElement === endElement
			? [startElement]
			: range.getNodes().filter((node) => isIdentifyableNode(node));

	return {
		id: startElement.id + startOffset + endElement.id + endOffset,
		startElement: startElement.id,
		startOffset,
		endElement: endElement.id,
		endOffset,
		markedElements: markedElements.map((element) => ({
			id: element.id,
			hash: element.dataset.hash,
		})),
		markedText: range.toString(),
		markedHtml: range.toHtml(),
		extendedText: markedElements.map((element) => element.textContent),
		extendedHtml: markedElements.map((element) => element.outerHTML),
	};
}
