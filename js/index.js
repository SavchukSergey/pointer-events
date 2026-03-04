import { createPointersState, PointerGestures, unrotate, unscale, unskew } from "/dist/index.js";

const containerNode = document.querySelector(".container");
const targetNode = document.querySelector(".target");
const chkTouchEmulation = document.getElementById("touch-emulation");
const chkSkew = document.getElementById("options-skew");
const chkRotate = document.getElementById("options-rotate");
const chkZoom = document.getElementById("options-zoom");

const pointers$ = createPointersState(containerNode);

const gestures = new PointerGestures();

gestures.dragStart$.subscribe((ev) => {
  ev.data = {};
});

let accMatrix = null;

function updateUiMatrix(matrix) {
  if (matrix) {
    if (!chkZoom.checked) {
      matrix = unscale(matrix);
    }
    if (!chkSkew.checked) {
      matrix = unskew(matrix);
    }
    if (!chkRotate.checked) {
      matrix = unrotate(matrix);
    }
  }
  targetNode.style.transform = matrix?.toString();
}

gestures.dragMove$.subscribe((ev) => {
  updateUiMatrix(accMatrix ? ev.matrix.mulM(accMatrix) : ev.matrix);
});

gestures.dragEnd$.subscribe((ev) => {
  accMatrix = accMatrix ? ev.matrix.mulM(accMatrix) : ev.matrix;
});

gestures.dragCancel$.subscribe((ev) => {
  updateUiMatrix(accMatrix);
});

pointers$.subscribe((state) => {
  if (!chkTouchEmulation.checked) {
    gestures.accept(state);
  }
});

["touch-1", "touch-2", "touch-3"].map((id) => {
  const touchNode = document.createElement("div");
  touchNode.id = id;
  touchNode.classList.add("touch");

  const int = parseInt(id.split("-")[1], 10);

  const pointerId = int + 100;

  const chkNode = document.createElement("input");
  chkNode.className = "touch-chk";
  chkNode.type = "checkbox";
  chkNode.id = `${id}-checkbox`;
  touchNode.appendChild(chkNode);

  const handleNode = document.createElement("div");
  handleNode.className = "touch-handle";
  handleNode.textContent = int;
  touchNode.appendChild(handleNode);

  const labelNode = document.createElement("label");
  labelNode.className = "touch-label";
  labelNode.htmlFor = `${id}-checkbox`;
  labelNode.textContent = "Toggle";
  touchNode.appendChild(labelNode);

  const width = window.innerWidth;
  const height = window.innerHeight;

  const angle = (int - 1) * (360 / 3);
  const radius = 100;
  let left = width / 2 + radius * Math.cos((angle * Math.PI) / 180);
  let top = height / 2 + radius * Math.sin((angle * Math.PI) / 180);

  touchNode.style.left = `${left}px`;
  touchNode.style.top = `${top}px`;
  document.body.appendChild(touchNode);

  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  chkNode.addEventListener("change", () => {
    if (chkNode.checked) {
      const downEvent = new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        pointerId,
        pointerType: "touch",
        clientX: left,
        clientY: top,
      });
      containerNode.dispatchEvent(downEvent);
    } else {
      const upEvent = new PointerEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        pointerId,
        pointerType: "touch",
        clientX: left,
        clientY: top,
      });
      containerNode.dispatchEvent(upEvent);
    }
  });

  handleNode.addEventListener("pointerdown", (event) => {
    dragging = true;
    dragStartX = event.clientX - left;
    dragStartY = event.clientY - top;

    handleNode.setPointerCapture(event.pointerId);
    touchNode.classList.add("touch-handle--grabbing");
  });
  handleNode.addEventListener("pointermove", (event) => {
    if (dragging) {
      left = event.clientX - dragStartX;
      top = event.clientY - dragStartY;
      touchNode.style.left = `${left}px`;
      touchNode.style.top = `${top}px`;
      if (chkNode.checked) {
        const moveEvent = new PointerEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          pointerId,
          pointerType: "touch",
          clientX: left,
          clientY: top,
        });
        containerNode.dispatchEvent(moveEvent);
      }
    }
  });
  handleNode.addEventListener("pointerup", (event) => {
    handleNode.releasePointerCapture(event.pointerId);
    dragging = false;
    touchNode.classList.remove("touch-handle--grabbing");
  });
  handleNode.addEventListener("pointercancel", (event) => {
    handleNode.releasePointerCapture(event.pointerId);
    console.log("cancel");
    dragging = false;
    touchNode.classList.remove("touch-handle--grabbing");
  });

  return {
    isDown() {
      return chkNode.checked;
    },
    getPosition() {
      return chkNode.checked ? { x: left, y: top } : undefined;
    },
  };
});
