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
	probe.style.cssText =
		"position:absolute;visibility:hidden;font-family:inherit;font-size:var(--cell-height);line-height:1;margin:0;padding:0;letter-spacing:0;white-space:pre;";
	probe.textContent = "X";
	document.body.appendChild(probe);
	const rect = probe.getBoundingClientRect();
	probe.remove();
	return [rect.width, rect.height];
}

let COLS = 0;
let ROWS = 0;
let tiles: string[] = [];

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
let titleText = "";
let postsRendered: { title: string; dek: string }[] = [];

async function initText() {
	figlet.parseFont("Graceful", graceful);
	titleText = await figlet.text("Wyatt\nStanke", { font: "Graceful" });

	const testPosts = Array.from({ length: 10 }, (_, i) => ({
		title: `test post ${i + 1}`,
		dek: `Description for test post ${i + 1}`,
	}));

	postsRendered = await Promise.all(
		testPosts.map(async (post) => ({
			title: await figlet.text(post.title, { font: "Graceful" }),
			dek: post.dek,
		})),
	);
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
	const leftCols = Math.floor(COLS / 3);
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

function drawPosts() {
	// clear right pane area entirely
	for (let y = 0; y < ROWS; y++) {
		for (let x = COLS - 2 * Math.floor(COLS / 3); x < COLS; x++) {
			updateTile(x, y, " ");
		}
	}
	const startY = -Math.floor(scrollPos);
	for (let i = 0; i < postsRendered.length; i++) {
		const y = startY + i * 10; // spacing between posts
		writeTextWithNewlines(
			COLS - 2 * Math.floor(COLS / 3) + 2,
			y,
			postsRendered[i].title,
		);
		writeTextWithNewlines(
			COLS - 2 * Math.floor(COLS / 3) + 2,
			y + 5,
			postsRendered[i].dek,
		);
	}
}

function drawAll() {
	tiles.fill(" ");
	drawLeftPane();
	drawPosts();
	render();
}

// Initial bootstrap
await initText();
build();
