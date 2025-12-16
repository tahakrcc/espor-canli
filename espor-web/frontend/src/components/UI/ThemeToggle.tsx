import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-color)',
                color: 'var(--primary-color)',
                border: '2px solid var(--primary-color)',
                boxShadow: 'var(--shadow-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                zIndex: 9999,
                transition: 'all 0.3s ease'
            }}
            title={theme === 'light' ? 'Karanlık Mod' : 'Aydınlık Mod'}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
};
