const list = document.getElementById("list"), announce = document.getElementById("announce");
let count = 0;
function add() {
  const item = document.createElement("div");
  item.className = "item"; item.textContent = "Item " + (++count);
  list.insertBefore(item, announce);
  announce.textContent = item.textContent + " added";
  item.scrollIntoView({ block: "nearest" });
}
document.getElementById("add").onclick = add;
for (let i = 0; i < 12; i++) add();
