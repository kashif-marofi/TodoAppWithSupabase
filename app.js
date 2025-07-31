import { client } from "./confg.js";

let taskText = document.getElementById("taskText");
let body = document.querySelector("body");
let main = document.getElementById("main");
let showTask = document.getElementById("showTask");
let addTask = document.getElementById("addTask");
let clearAll = document.getElementById("clearAll");
let editForm = document.getElementById("editForm");
let updateBtn = document.getElementById("updateBtn");
let updatedValue = document.getElementById("updatedValue");

let allTasks = JSON.parse(localStorage.getItem("allTasks")) || [];
let currentEditIndex = null;

if (addTask) {
  addTask.addEventListener("click", async () => {
    if (taskText.value.trim() === "") {
      Swal.fire({
        icon: "warning",
        title: "Oops!",
        text: "Please write a task or something productive!",
        confirmButtonText: "Got it!",
      });
      return; // stop if input is empty
    }
    const { error } = await client
      .from("Todo")
      .insert({ Tasks: taskText.value });
    if (error) {
      console.log("error", error.message);
    } else {
      Swal.fire({
        icon: "success",
        title: "Task Added!",
        text: "Your task was added successfully.",
        timer: 2500, 
        showConfirmButton: false,
        toast: false, 
        position: "center",
      });

      show();
      taskText.value = "";
    }
  });
}

async function show() {
  const { data, error } = await client.from("Todo").select();
  if (error) {
    console.log("error", error.message);
  } else {
    console.log("Data", data);
    // Store fetched data in array
    allTasks = data;

    renderTasks();
  }
}

function renderTasks() {
  showTask.innerHTML = "";

  allTasks.forEach((item, index) => {
    let div = document.createElement("div");
    div.className = "task-box shadow";

    div.innerHTML = `
      <div class="task-content">
        <p  style="margin-top: 10px;" class="task-text">${item.Tasks}</p>
        <div class="task-buttons">
          <button class="btn edit-btn" onclick="editTask(${index})">Edit</button>
          <button class="btn delete-btn" onclick="deleteTask(${index})">Delete</button>

        </div>
      </div>
    `;
    // Done button
    // <button class="btn done-btn" onclick="markDone(${index})">Done</button>
    showTask.appendChild(div);
  });
}
if (clearAll) {
  clearAll.addEventListener("click", async () => {
    if (allTasks.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No tasks found",
        text: "You haven't added any tasks yet!",
      });
      return; // stop the function
    } else {
      Swal.fire({
        title: "Are you sure?",
        text: "This will delete all your tasks permanently!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e74c3c",
        cancelButtonColor: "#3498db",
        confirmButtonText: "Yes, delete all!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          const { error } = await client.from("Todo").delete().neq("id", 0);

          if (error) {
            console.error("Error clearing tasks:", error.message);
          }

          localStorage.removeItem("allTasks");
          allTasks = [];
          renderTasks();

          Swal.fire("Deleted!", "All tasks have been removed.", "success");
        }
      });
    }
  });
}

function editTask(index) {
  currentEditIndex = index;
  updatedValue.value = allTasks[index].Tasks;

  // Show edit UI
  editForm.style.display = "block";
  body.style.backgroundColor = "gray";
  body.style.opacity = "0.8";
  main.style.display = "none";
  showTask.style.display = "none";
}

updateBtn.addEventListener("click", async function () {
  let updatedText = updatedValue.value.trim();
  if (!updatedText) return;

  let taskId = allTasks[currentEditIndex].id;

  const { error } = await client
    .from("Todo")
    .update({ Tasks: updatedText })
    .eq("id", taskId);

  if (error) {
    console.error("Error updating:", error.message);
    return;
  }

  Swal.fire({
    icon: "success",
    title: "Task Updated",
    timer: 1500,
    showConfirmButton: false,
  });

  // Refresh data
  await show();

  // Restore UI
  editForm.style.display = "none";
  body.style.backgroundColor = "white";
  body.style.opacity = "1";
  main.style.display = "block";
  showTask.style.display = "block";
});


function deleteTask(index) {
  const taskId = allTasks[index].id;

  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to recover this task!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  }).then(async (result) => {
    if (result.isConfirmed) {
      const { error } = await client
        .from("Todo")
        .delete()
        .eq("id", taskId);

      if (error) {
        console.error("Delete failed:", error.message);
        return;
      }

      Swal.fire("Deleted!", "Your task has been deleted.", "success");
      await show(); // Refresh the UI
    }
  });
}

window.editTask = editTask;
window.deleteTask = deleteTask;

show();
