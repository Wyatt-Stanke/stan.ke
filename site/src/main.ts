import figlet from "figlet";
import graceful from "figlet/fonts/Graceful";

import "./style.css";

// biome-ignore lint/style/noNonNullAssertion: Typescript sucks
const grid = document.getElementById("grid")!;
if (!grid) {
	throw new Error("Grid element not found");
}

function cellSizePx(): [number, number] {
	const probe = document.createElement("span");
	const gridStyle = window.getComputedStyle(grid);
	probe.style.fontFamily = gridStyle.fontFamily;
	probe.style.fontSize = gridStyle.fontSize;
	probe.style.lineHeight = gridStyle.lineHeight;
	probe.style.letterSpacing = gridStyle.letterSpacing;
	probe.style.position = "absolute";
	probe.style.visibility = "hidden";
	probe.style.whiteSpace = "pre";
	probe.textContent = "X";
	document.body.appendChild(probe);
	const rect = probe.getBoundingClientRect();
	probe.remove();
	return [rect.width, rect.height];
}

let COLS = 0;
let ROWS = 0;
let tiles: string[] = [];

type LayoutMode = "split" | "stack";
let layoutMode: LayoutMode = "split";
let headerBottom = 0;

const idx = (x: number, y: number) => y * COLS + x;

// Renders the virtual grid to the DOM
function render(): void {
	let text = "";
	for (let y = 0; y < ROWS; y++) {
		const start = y * COLS;
		text += `${tiles.slice(start, start + COLS).join("")}\n`;
	}
	grid.textContent = text;
}

function build(): void {
	const size = cellSizePx();
	const cols = Math.max(1, Math.floor(window.innerWidth / size[0]));
	const rows = Math.max(1, Math.floor(window.innerHeight / size[1]));
	if (cols === COLS && rows === ROWS) return;

	COLS = cols;
	ROWS = rows;
	layoutMode = chooseLayout();

	tiles = new Array(COLS * ROWS).fill(" ");

	// Force a redraw of everything if window resizes
	drawAll();
}

function updateTile(x: number, y: number, value: string): void {
	if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
	tiles[idx(x, y)] = value || " ";
}

function writeText(x: number, y: number, text: string): void {
	for (let i = 0; i < text.length; i++) {
		updateTile(x + i, y, text[i]);
	}
}

function writeTextWithNewlines(x: number, y: number, text: string): void {
	const lines = text.split("\n");
	for (let i = 0; i < lines.length; i++) {
		writeText(x, y + i, lines[i]);
	}
}

// Global text strings
const PLAIN_TITLE = "Wyatt Stanke";
const testPosts = Array.from({ length: 10 }, (_, i) => ({
	title: `test post ${i + 1}`,
	dek: `Description for test post ${i + 1}`,
}));
let titleText = "";
let postsRendered: { title: string; dek: string }[] = [];
const FONT_HEIGHT = Number.parseInt(
	graceful.split("\n")[0].trim().split(/\s+/)[2],
	10,
);

async function initText() {
	figlet.parseFont("Graceful", graceful);
	titleText = await figlet.text("Wyatt\nStanke", { font: "Graceful" });

	postsRendered = await Promise.all(
		testPosts.map(async (post) => ({
			title: await figlet.text(post.title, { font: "Graceful" }),
			dek: post.dek,
		})),
	);
}

function titleWidth(): number {
	if (!titleText) return 0;
	return Math.max(...titleText.split("\n").map((line) => line.length));
}

function postTitleWidth(): number {
	let max = 0;
	for (const post of postsRendered) {
		for (const line of post.title.split("\n")) {
			if (line.length > max) max = line.length;
		}
	}
	return max;
}

function splitLeftCols(): number {
	const minLeft = titleWidth() + 3;
	const maxLeft = COLS - postTitleWidth() - 3;
	const preferred = Math.floor(COLS / 3);
	return Math.min(Math.max(preferred, minLeft), maxLeft);
}

function chooseLayout(): LayoutMode {
	const titleW = titleWidth();
	const postW = postTitleWidth();
	if (titleW === 0 || postW === 0) return "stack";
	return COLS >= titleW + postW + 6 ? "split" : "stack";
}

// Rebuild on resize
let raf = 0;
window.addEventListener("resize", () => {
	cancelAnimationFrame(raf);
	raf = requestAnimationFrame(build);
});

let scrollPos = 0;
window.addEventListener("wheel", (ev) => {
	scrollPos += ev.deltaY / 10;
	scrollPos = Math.max(0, scrollPos);

	cancelAnimationFrame(raf);
	raf = requestAnimationFrame(() => {
		drawPosts();
		render();
	});
});

// Touch drag scrolling for mobile
let lastTouchY = 0;
window.addEventListener(
	"touchstart",
	(ev) => {
		if (ev.touches.length > 0) {
			lastTouchY = ev.touches[0].clientY;
		}
	},
	{ passive: true },
);

window.addEventListener(
	"touchmove",
	(ev) => {
		if (ev.touches.length === 0) return;
		const y = ev.touches[0].clientY;
		const delta = lastTouchY - y;
		lastTouchY = y;

		scrollPos = Math.max(0, scrollPos + delta / 10);

		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(() => {
			drawPosts();
			render();
		});
	},
	{ passive: true },
);

// arrow keys or vim keys (if you're nasty like that)
window.addEventListener("keydown", (ev) => {
	if (ev.key === "ArrowUp" || ev.key === "k") {
		scrollPos = Math.max(0, scrollPos - 3);
	} else if (ev.key === "ArrowDown" || ev.key === "j") {
		scrollPos += 3;
	}
	cancelAnimationFrame(raf);
	raf = requestAnimationFrame(() => {
		drawPosts();
		render();
	});
});

function drawLeftPane() {
	const leftCols = splitLeftCols();
	for (let y = 0; y < ROWS; y++) {
		for (let x = 0; x < leftCols; x++) {
			if (y === 0 || y === ROWS - 1 || x === 0 || x === leftCols - 1) {
				updateTile(x, y, "X");
			}
		}
	}
	if (titleText) {
		writeTextWithNewlines(2, 1, titleText);
	}
}

function drawHeader() {
	headerBottom = 0;
	const lines = [PLAIN_TITLE];
	const bottomBorder = lines.length + 1;

	for (let x = 0; x < COLS; x++) {
		updateTile(x, 0, "X");
		if (bottomBorder < ROWS) {
			updateTile(x, bottomBorder, "X");
		}
	}

	for (let i = 0; i < lines.length; i++) {
		writeText(2, 1 + i, lines[i].slice(0, Math.max(0, COLS - 4)));
	}

	headerBottom = bottomBorder + 1;
}

function drawScrollBar(
	start: number,
	count: number,
	scroll: number,
	total: number,
	column: number,
) {
	const scrollPercent = scroll / Math.max(1, total - count);
	const scrollBarHeight = Math.max(
		(count / Math.max(count, total)) * count,
		1,
	);
	const scrollBarStart = scrollPercent * (count - scrollBarHeight);
	for (let i = 0; i < count; i++) {
		const s = Math.floor(scrollBarStart);
		const e = Math.floor(scrollBarStart + scrollBarHeight) - 1;
		const y = start + i;

		if (i < s || i > e) {
			updateTile(column, y, "|");
		} else if (i === s) {
			updateTile(column, y, "n");
		} else if (i === e) {
			updateTile(column, y, "u");
		} else {
			updateTile(column, y, "#");
		}
	}
}

function drawPostList(x: number, y: number, width: number, height: number) {
	const postHeight = layoutMode === "stack" ? 3 : 10;
	const maxScroll = Math.max(0, postsRendered.length * postHeight - height);
	if (scrollPos > maxScroll) scrollPos = maxScroll;
	const startY = y - Math.floor(scrollPos);
	const clipBottom = y + height;

	for (let i = 0; i < testPosts.length; i++) {
		const py = startY + i * postHeight;
		const titleLines =
			layoutMode === "stack"
				? [testPosts[i].title]
				: postsRendered[i].title.split("\n");
		for (let j = 0; j < titleLines.length; j++) {
			const lineY = py + j;
			if (lineY >= y && lineY < clipBottom) {
				writeText(x, lineY, titleLines[j].slice(0, width));
			}
		}

		const dekY = py + (layoutMode === "stack" ? 1 : FONT_HEIGHT + 1);
		if (dekY >= y && dekY < clipBottom) {
			writeText(x, dekY, testPosts[i].dek.slice(0, width));
		}
	}
}

function drawPosts() {
	if (layoutMode === "split") {
		const rightStart = splitLeftCols();
		const contentWidth = Math.max(1, COLS - rightStart - 3);

		for (let y = 0; y < ROWS; y++) {
			for (let x = rightStart; x < COLS; x++) {
				updateTile(x, y, " ");
			}
		}

		drawPostList(rightStart + 2, 0, contentWidth, ROWS);
		drawScrollBar(0, ROWS, scrollPos, postsRendered.length * 10, COLS - 1);
		return;
	}

	const contentX = 1;
	const contentWidth = Math.max(1, COLS - 3);
	const paneTop = Math.min(ROWS, headerBottom);
	const paneRows = Math.max(1, ROWS - paneTop);

	for (let y = paneTop; y < ROWS; y++) {
		for (let x = 0; x < COLS - 1; x++) {
			updateTile(x, y, " ");
		}
	}

	drawPostList(contentX, paneTop + 1, contentWidth, paneRows);
	drawScrollBar(paneTop, paneRows, scrollPos, testPosts.length * 3, COLS - 1);
}

function drawAll() {
	tiles.fill(" ");
	headerBottom = 0;
	if (layoutMode === "split") {
		drawLeftPane();
	} else {
		drawHeader();
	}
	drawPosts();
	render();
}

try {
	await document.fonts.load('1rem "Linux Libertine Mono"');
} catch (_) {}
await document.fonts.ready;
await initText();
build();
