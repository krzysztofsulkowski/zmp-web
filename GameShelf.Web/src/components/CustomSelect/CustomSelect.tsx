import { useEffect, useRef, useState } from 'react';
import styles from './CustomSelect.module.css';

type Option = {
    value: string;
    label: string;
};

type CustomSelectProps = {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
};

export function CustomSelect({ value, onChange, options, placeholder = 'Wybierz...' }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;
    const isPlaceholder = !value;

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    return (
        <div
            className={`${styles.wrapper} ${isOpen ? styles.open : ''}`}
            ref={containerRef}
        >
            <button
                type="button"
                className={styles.trigger}
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={isPlaceholder ? styles.placeholder : styles.selectedLabel}>
                    {selectedLabel}
                </span>
                <svg
                    className={styles.chevron}
                    viewBox="0 0 12 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M1 1L6 7L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {isOpen && (
                <div className={styles.dropdown} role="listbox">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={option.value === value}
                            className={`${styles.option} ${option.value === value ? styles.optionActive : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            {option.value === value && (
                                <svg className={styles.checkIcon} viewBox="0 0 12 10" fill="none">
                                    <path d="M1 5L4.5 8.5L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}