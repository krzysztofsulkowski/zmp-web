import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomSelect } from './CustomSelect';

const OPTIONS = [
    { value: 'rpg', label: 'RPG' },
    { value: 'fps', label: 'FPS' },
    { value: 'strategy', label: 'Strategia' },
];

function renderSelect(props?: Partial<Parameters<typeof CustomSelect>[0]>) {
    const onChange = vi.fn();
    const result = render(
        <CustomSelect
            value=""
            onChange={onChange}
            options={OPTIONS}
            {...props}
        />
    );
    return { ...result, onChange };
}

describe('CustomSelect – renderowanie', () => {
    it('wyświetla domyślny placeholder gdy brak wartości', () => {
        renderSelect();
        expect(screen.getByRole('button', { name: /wybierz/i })).toBeInTheDocument();
    });

    it('wyświetla niestandardowy placeholder', () => {
        renderSelect({ placeholder: 'Wybierz gatunek' });
        expect(screen.getByText('Wybierz gatunek')).toBeInTheDocument();
    });

    it('wyświetla etykietę wybranej opcji zamiast placeholdera', () => {
        renderSelect({ value: 'fps' });
        expect(screen.getByText('FPS')).toBeInTheDocument();
    });

    it('na starcie lista opcji jest ukryta', () => {
        renderSelect();
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
});

describe('CustomSelect – otwieranie i zamykanie', () => {
    it('otwiera dropdown po kliknięciu triggera', async () => {
        const user = userEvent.setup();
        renderSelect();
        await user.click(screen.getByRole('button'));
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('zamyka dropdown po ponownym kliknięciu triggera', async () => {
        const user = userEvent.setup();
        renderSelect();
        const trigger = screen.getByRole('button');
        await user.click(trigger);
        await user.click(trigger);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('zamyka dropdown po naciśnięciu Escape', async () => {
        const user = userEvent.setup();
        renderSelect();
        await user.click(screen.getByRole('button'));
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('zamyka dropdown po kliknięciu poza komponentem', async () => {
        const user = userEvent.setup();
        render(
            <div>
                <CustomSelect value="" onChange={vi.fn()} options={OPTIONS} />
                <button>Poza selectem</button>
            </div>
        );
        await user.click(screen.getByRole('button', { name: /wybierz/i }));
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Poza selectem' }));
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('ustawia aria-expanded=true gdy otwarty', async () => {
        const user = userEvent.setup();
        renderSelect();
        const trigger = screen.getByRole('button');
        await user.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('ustawia aria-expanded=false gdy zamknięty', () => {
        renderSelect();
        expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });
});

describe('CustomSelect – wybieranie opcji', () => {
    it('wyświetla wszystkie opcje po otwarciu', async () => {
        const user = userEvent.setup();
        renderSelect();
        await user.click(screen.getByRole('button'));
        const listbox = screen.getByRole('listbox');
        const options = within(listbox).getAllByRole('option');
        expect(options).toHaveLength(OPTIONS.length);
    });

    it('wywołuje onChange z poprawną wartością po wyborze', async () => {
        const user = userEvent.setup();
        const { onChange } = renderSelect();
        await user.click(screen.getByRole('button'));
        await user.click(screen.getByRole('option', { name: 'FPS' }));
        expect(onChange).toHaveBeenCalledWith('fps');
    });

    it('zamyka dropdown po wyborze opcji', async () => {
        const user = userEvent.setup();
        renderSelect();
        await user.click(screen.getByRole('button'));
        await user.click(screen.getByRole('option', { name: 'RPG' }));
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('oznacza wybraną opcję jako aria-selected=true', async () => {
        const user = userEvent.setup();
        renderSelect({ value: 'strategy' });
        await user.click(screen.getByRole('button'));
        const selected = screen.getByRole('option', { name: /strategia/i });
        expect(selected).toHaveAttribute('aria-selected', 'true');
    });

    it('pozostałe opcje mają aria-selected=false', async () => {
        const user = userEvent.setup();
        renderSelect({ value: 'strategy' });
        await user.click(screen.getByRole('button'));
        const notSelected = screen.getByRole('option', { name: 'RPG' });
        expect(notSelected).toHaveAttribute('aria-selected', 'false');
    });

    it('onChange nie jest wywoływany gdy dropdown jest zamknięty', () => {
        const { onChange } = renderSelect();
        expect(onChange).not.toHaveBeenCalled();
    });
});
