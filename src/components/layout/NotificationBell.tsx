"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle } from "lucide-react";
import { getUnreadNotifications, markAsRead, markAllAsRead } from "@/app/notifications/actions";
import Link from "next/link";
import styles from "./NotificationBell.module.css";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    const data = await getUnreadNotifications();
    setNotifications(data);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications([]);
  };

  return (
    <div className={styles.container}>
      <button 
        className={styles.bellButton} 
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className={styles.badge}>{notifications.length > 9 ? '9+' : notifications.length}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h4>Notifications</h4>
            {notifications.length > 0 && (
              <button onClick={handleMarkAllAsRead} className={styles.markAllBtn}>
                Mark all as read
              </button>
            )}
          </div>
          
          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>No new notifications</div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={styles.item}>
                  <div className={styles.itemContent}>
                    <strong>{notif.title}</strong>
                    <p>{notif.message}</p>
                    {notif.link && (
                      <Link href={notif.link} className={styles.link} onClick={() => handleMarkAsRead(notif.id)}>
                        View Details
                      </Link>
                    )}
                  </div>
                  <button onClick={() => handleMarkAsRead(notif.id)} className={styles.checkBtn} title="Mark as read">
                    <CheckCircle size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
