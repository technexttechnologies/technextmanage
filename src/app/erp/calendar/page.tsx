import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Video } from "lucide-react";
import styles from "./page.module.css";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string, year?: string }> }) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN", "HR", "OPERATIONS"].includes(session.role as string)) {
    redirect("/");
  }
  
  const resolvedParams = await searchParams;
  
  const now = new Date();
  const currentMonth = resolvedParams.month ? parseInt(resolvedParams.month) : now.getMonth();
  const currentYear = resolvedParams.year ? parseInt(resolvedParams.year) : now.getFullYear();
  
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  const events = await prisma.erpEvent.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    },
    orderBy: { date: "asc" }
  });

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'MEETING': return styles.typeMeeting;
      case 'HOLIDAY': return styles.typeHoliday;
      case 'HR': return styles.typeHr;
      case 'EVENT': return styles.typeEvent;
      default: return styles.typeDefault;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <CalendarIcon className={styles.icon} />
          <h1>Company Calendar</h1>
        </div>
        <Link href="/erp/calendar/new" className={styles.btnPrimary}>
          <Plus size={18} /> Add Event
        </Link>
      </header>

      <div className={styles.filters}>
        <h2>{startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <div className={styles.navButtons}>
          <Link 
            href={`/erp/calendar?month=${currentMonth === 0 ? 11 : currentMonth - 1}&year=${currentMonth === 0 ? currentYear - 1 : currentYear}`}
            className={styles.btnSecondary}
          >
            Previous
          </Link>
          <Link 
            href={`/erp/calendar?month=${now.getMonth()}&year=${now.getFullYear()}`}
            className={styles.btnSecondary}
          >
            Today
          </Link>
          <Link 
            href={`/erp/calendar?month=${currentMonth === 11 ? 0 : currentMonth + 1}&year=${currentMonth === 11 ? currentYear + 1 : currentYear}`}
            className={styles.btnSecondary}
          >
            Next
          </Link>
        </div>
      </div>

      <div className={styles.eventsGrid}>
        {events.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No events scheduled for this month.</p>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className={`${styles.eventCard} ${getEventTypeColor(event.type)}`}>
              <div className={styles.eventDate}>
                <span className={styles.day}>{new Date(event.date).getDate()}</span>
                <span className={styles.month}>{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
              </div>
              <div className={styles.eventDetails}>
                <h3 className={styles.eventTitle}>{event.title}</h3>
                <span className={styles.badge}>{event.type}</span>
                
                {(event.startTime || event.endTime) && (
                  <div className={styles.eventMeta}>
                    <Clock size={14} />
                    <span>{event.startTime || ''} {event.endTime ? `- ${event.endTime}` : ''}</span>
                  </div>
                )}
                
                {event.location && (
                  <div className={styles.eventMeta}>
                    <MapPin size={14} />
                    <span>{event.location}</span>
                  </div>
                )}

                {event.meetLink && (
                  <div className={styles.eventMeta}>
                    <Video size={14} />
                    <a href={event.meetLink} target="_blank" rel="noopener noreferrer">Join Meeting</a>
                  </div>
                )}
                
                {event.description && (
                  <p className={styles.eventDesc}>{event.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
