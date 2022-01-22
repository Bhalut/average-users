const socket = io();

socket.on("average", (value) => {
  const container = document.querySelector(".console");
  const data = document.createElement("p");

  data.textContent = value;
  container.appendChild(data);
});
