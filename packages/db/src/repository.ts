import { demoData } from "./seeds/demo-data.js";
import type { Task, AttendanceRecord, Resource, UserProfile, UserRole } from "@campusos/core";

export interface CampusUser {
  id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
}

class DemoRepository {
  private users: CampusUser[] = demoData.users as CampusUser[];
  private events: any[] = [...demoData.events];
  private tasks: any[] = [...demoData.tasks];
  private attendance: any[] = [...demoData.attendance];
  private resources: any[] = [...demoData.resources];
  private organizations: any[] = [...demoData.organizations];

  // User queries
  getUsers(): CampusUser[] {
    return this.users;
  }

  getUserById(id: string): CampusUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  // Events
  getEvents(): any[] {
    return this.events;
  }

  getEventById(id: string): any | undefined {
    return this.events.find((e) => e.id === id);
  }

  createEvent(event: any): any {
    const newEvent = {
      ...event,
      id: event.id || `ev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.events.unshift(newEvent);
    return newEvent;
  }

  // Tasks
  getTasks(userId?: string): Task[] {
    if (userId) {
      return this.tasks.filter((t) => t.userId === userId);
    }
    return this.tasks;
  }

  createTask(task: any): Task {
    const newTask = {
      ...task,
      id: task.id || `tsk-${Date.now()}`,
      status: task.status || "TODO",
      priority: task.priority || "MEDIUM",
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);
    return newTask;
  }

  // Attendance
  getAttendance(userId?: string): AttendanceRecord[] {
    if (userId) {
      return this.attendance.filter((a) => a.userId === userId);
    }
    return this.attendance;
  }

  // Resources
  getResources(): Resource[] {
    return this.resources;
  }

  // Organizations
  getOrganizations(): any[] {
    return this.organizations;
  }
}

export const demoDb = new DemoRepository();
