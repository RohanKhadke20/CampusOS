"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import type { Task } from "@campusos/core";
import { CheckSquare, Plus, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export function TasksView() {
  const { activePersona } = useApp();
  const [tasks, setTasks] = useState<Task[]>(() => demoDb.getTasks(activePersona.id));
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("MEDIUM");

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    demoDb.createTask({
      userId: activePersona.id,
      title: newTitle,
      priority: newPriority,
      status: "TODO",
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    });

    setTasks(demoDb.getTasks(activePersona.id));
    setNewTitle("");
  };

  const handleToggleStatus = (taskId: string, currentStatus: Task["status"]) => {
    const nextStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    demoDb.updateTaskStatus(taskId, nextStatus);
    setTasks(demoDb.getTasks(activePersona.id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
          Tasks & Project Milestones
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Track course deliverables, club responsibilities, and hackathon project sprints.
        </p>
      </div>

      {/* Task Creation Form */}
      <form
        onSubmit={handleCreateTask}
        className="flex flex-col sm:flex-row items-center gap-2 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new academic assignment or club task..."
          className="flex-1 w-full px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-indigo-500"
          required
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as any)}
          className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none"
        >
          <option value="LOW">Low Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="HIGH">High Priority</option>
          <option value="URGENT">Urgent</option>
        </select>
        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-2.5">
        {tasks.map((task) => {
          const isDone = task.status === "DONE";
          return (
            <div
              key={task.id}
              onClick={() => handleToggleStatus(task.id!, task.status)}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isDone
                  ? "bg-[var(--surface)]/40 border-[var(--border)]/40 opacity-60"
                  : "bg-[var(--surface)] border-[var(--border)] hover:border-indigo-500/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                    isDone
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-[var(--border)] bg-[var(--background)]"
                  }`}
                >
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div
                    className={`text-xs font-semibold ${
                      isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--foreground)]"
                    }`}
                  >
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {task.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                    task.priority === "HIGH" || task.priority === "URGENT"
                      ? "bg-rose-500/10 text-rose-400"
                      : "bg-indigo-500/10 text-indigo-400"
                  }`}
                >
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
