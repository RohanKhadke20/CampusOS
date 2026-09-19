"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import type { Task } from "@campusos/core";
import { Plus, Clock, CheckCircle2, CheckSquare } from "lucide-react";
import {
  Button,
  Badge,
  Card,
  Input,
  Select,
} from "@campusos/ui";

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

  const getPriorityBadgeVariant = (priority: Task["priority"]) => {
    switch (priority) {
      case "URGENT":
        return "critical";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "brand";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Tasks & Project Milestones
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Track course deliverables, club responsibilities, and hackathon project sprints.
        </p>
      </div>

      {/* Task Creation Form */}
      <Card variant="default">
        <form
          onSubmit={handleCreateTask}
          className="flex flex-col sm:flex-row items-center gap-3 p-3.5"
        >
          <div className="flex-1 w-full">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a new academic assignment or club deliverable..."
              required
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>
          <Button
            type="submit"
            size="md"
            variant="primary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Task
          </Button>
        </form>
      </Card>

      {/* Task List */}
      <div className="space-y-2.5">
        {tasks.map((task) => {
          const isDone = task.status === "DONE";
          return (
            <div
              key={task.id}
              onClick={() => handleToggleStatus(task.id!, task.status)}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-150 ${
                isDone
                  ? "bg-[var(--surface)]/40 border-[var(--border-subtle)] opacity-60"
                  : "bg-[var(--surface)] border-[var(--border-subtle)] hover:border-[var(--border-interactive)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    isDone
                      ? "bg-[var(--status-success)] border-[var(--status-success)] text-white"
                      : "border-[var(--border-interactive)] bg-[var(--canvas)]"
                  }`}
                >
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div
                    className={`text-xs font-semibold ${
                      isDone
                        ? "line-through text-[var(--text-muted)]"
                        : "text-[var(--text-primary)]"
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

              <div className="flex items-center gap-2.5">
                <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
                  {task.priority}
                </Badge>
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
