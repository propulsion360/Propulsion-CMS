import React from 'react';
import payload from 'payload';
import type { Template } from '@payload-types';
import Link from 'next/link';
import styles from '../styles/shared.module.css';

async function getTemplates() {
  try {
    const response = await payload.find({
      collection: 'templates',
      where: {
        status: {
          equals: 'published',
        },
        isActive: {
          equals: true,
        },
      },
      sort: '-createdAt',
    });

    return response.docs as Template[];
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

export default async function CollectionsPage() {
  const templates = await getTemplates();

  return (
    <div className={styles.container}>
      <div className={`${styles.flex} ${styles.flexBetween} ${styles.mb8}`}>
        <h1 className={styles.heading1}>Template Collection</h1>
        <div className={styles.flex}>
          <select className={styles.select}>
            <option value="">All Categories</option>
            <option value="business">Business</option>
            <option value="ecommerce">E-commerce</option>
            <option value="blog">Blog</option>
            <option value="portfolio">Portfolio</option>
            <option value="landing">Landing Page</option>
            <option value="other">Other</option>
          </select>
          <select className={styles.select}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {templates.length > 0 ? (
        <div className={`${styles.grid} ${styles.gridCols1} ${styles.gridCols2} ${styles.gridCols3} ${styles.gridCols4}`}>
          {templates.map((template) => (
            <div key={template.id} className={styles.card}>
              {template.thumbnail ? (
                <img
                  src={typeof template.thumbnail === 'string' ? template.thumbnail : template.thumbnail?.url || ''}
                  alt={template.name}
                  className={styles.cardImage}
                />
              ) : (
                <div className={`${styles.cardImage} ${styles.flex} ${styles.flexCenter}`}>
                  <span className={styles.textGrayLight}>No thumbnail</span>
                </div>
              )}
              <div className={styles.cardContent}>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>
                  {template.category || 'Uncategorized'}
                </span>
                <h3 className={styles.cardTitle}>
                  <Link href={`/templates/${template.id}`}>{template.name}</Link>
                </h3>
                <p className={`${styles.cardDescription} ${styles.textGray}`}>
                  {template.description || 'No description available'}
                </p>
                <div className={`${styles.flex} ${styles.flexBetween}`}>
                  <Link
                    href={`/templates/${template.id}`}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    View Details
                  </Link>
                  <span className={styles.textGrayLight}>
                    {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${styles.textCenter} ${styles.mb8}`}>
          <h3 className={`${styles.heading3} ${styles.textGray}`}>No templates found</h3>
          <p className={styles.textGrayLight}>Check back later for new templates</p>
        </div>
      )}
    </div>
  );
} 