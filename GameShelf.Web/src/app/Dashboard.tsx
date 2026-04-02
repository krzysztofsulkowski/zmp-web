import React from 'react';
import styles from "./Dashboard.module.css";

const Dashboard: React.FC = () => {
    const token = localStorage.getItem('authToken');

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logo}>GameOrganizer</div>
                
                <div className={styles.navActions}>                    
                    <div className={styles.userProfile}>A</div>
                </div>
            </header>            
        </div>
    );
};

export default Dashboard;