/**
 * The base components hold the canvas board "Design language · Sizes" (#18).
 *
 * Every number below is written out from the board itself, not imported from
 * `src/components/base/sizes.ts`: the point is that changing a dimension there
 * (a button height, a row height) turns this red until the board changes too.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Bell, Plus, UserRound } from 'lucide-react'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import {
  Avatar,
  Button,
  Composer,
  Group,
  IconButton,
  Pill,
  Progress,
  Row,
  SearchField,
  SegmentedFilter,
  SegmentedNav,
  Toggle,
  initialsOf,
} from '@/components/base'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

const px = (value: number) => `${value}px`

describe('Button (Sizes: three sizes, three weights)', () => {
  it.each([
    ['large', 50, 17, 24, 12],
    ['regular', 40, 15, 18, 10],
    ['small', 32, 13, 12, 8],
  ] as const)('is %s: %i high, text %i, padding %i, radius %i', (size, height, font, pad, radius) => {
    render(<Button size={size}>Check answer</Button>)
    const button = screen.getByRole('button', { name: 'Check answer' })

    expect(button).toHaveStyle({
      height: px(height),
      fontSize: px(font),
      paddingInline: px(pad),
      borderRadius: px(radius),
    })
    expect(button).toHaveClass('font-semibold')
  })

  it('is regular and filled unless told otherwise, and never submits a form by accident', () => {
    render(<Button>Open report</Button>)
    const button = screen.getByRole('button', { name: 'Open report' })

    expect(button).toHaveAttribute('data-size', 'regular')
    expect(button).toHaveAttribute('data-variant', 'filled')
    expect(button).toHaveAttribute('type', 'button')
  })

  it.each(['filled', 'tinted', 'gray', 'onSky'] as const)('keeps its padding as %s', (variant) => {
    render(<Button variant={variant}>Resume</Button>)
    expect(screen.getByRole('button')).toHaveStyle({ paddingInline: '18px' })
  })

  it.each(['plain', 'onSkyPlain'] as const)('is bare text as %s, at the same height', (variant) => {
    render(<Button variant={variant}>Skip</Button>)
    expect(screen.getByRole('button')).toHaveStyle({ paddingInline: '0px', height: '40px' })
  })

  it('draws the white-on-dark button from the sky tokens only', () => {
    render(<Button variant="onSky">Continue</Button>)
    expect(screen.getByRole('button').className).toContain('--on-sky-button')
    expect(screen.getByRole('button').className).toContain('--on-sky-button-text')
  })

  it('renders a link with the button look', () => {
    render(
      <MemoryRouter>
        <Button asChild size="large">
          <a href="/next">Next</a>
        </Button>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: 'Next' })
    expect(link).toHaveStyle({ height: '50px' })
    expect(link).not.toHaveAttribute('type')
  })
})

describe('IconButton (Sizes: box / glyph)', () => {
  it.each([
    [24, 14],
    [28, 16],
    [30, 18],
    [32, 20],
    [34, 20],
    [36, 22],
  ] as const)('is a %i box with a %i glyph', (box, glyph) => {
    render(<IconButton label="Notifications" icon={Bell} size={box} />)
    const button = screen.getByRole('button', { name: 'Notifications' })

    expect(button).toHaveStyle({ width: px(box), height: px(box) })
    const svg = button.querySelector('svg')
    expect(svg).toHaveAttribute('width', String(glyph))
    expect(svg).toHaveAttribute('height', String(glyph))
    expect(svg).toHaveAttribute('stroke-width', '1.6')
  })

  it('can take a 44 hit area around a 36 face', () => {
    render(<IconButton label="Notifications" icon={Bell} size={36} hitSize={44} />)
    const button = screen.getByRole('button', { name: 'Notifications' })

    expect(button).toHaveStyle({ width: '44px', height: '44px' })
    expect(button.querySelector('[data-icon-button-face]')).toHaveStyle({ width: '36px', height: '36px' })
    expect(button.querySelector('svg')).toHaveAttribute('width', '22')
  })

  it('always carries its label, read out and as the tooltip', () => {
    render(<IconButton label="Add" icon={Plus} />)
    const button = screen.getByRole('button', { name: 'Add' })
    expect(button).toHaveAttribute('title', 'Add')
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Avatar (Sizes: 16 ... 60)', () => {
  it.each([
    [16, 11],
    [26, 11],
    [28, 11],
    [30, 12],
    [36, 15],
    [44, 19],
    [60, 27],
  ] as const)('is %i across with %i px initials', (size, font) => {
    const { container } = render(<Avatar name="Lina Meier" size={size} />)
    const avatar = container.querySelector('[data-avatar]')

    expect(avatar).toHaveStyle({ width: px(size), height: px(size), fontSize: px(font) })
    expect(avatar).toHaveTextContent('LM')
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
  })

  it('takes the first and last initial, and copes with no name', () => {
    expect(initialsOf('Ada King Lovelace')).toBe('AL')
    expect(initialsOf('élodie')).toBe('É')
    expect(initialsOf('  ')).toBe('?')
    expect(initialsOf(undefined)).toBe('?')
  })
})

describe('Segmented (Sizes: navigation 30, filters 28)', () => {
  it('navigates between pages at 30, text 14, padding 12, radius 9 / 7', () => {
    render(
      <MemoryRouter>
        <SegmentedNav
          label="Teacher"
          activeIndex={0}
          items={[
            { to: '/tutor', label: 'Requests' },
            { to: '/tutor/availability', label: 'Availability' },
          ]}
        />
      </MemoryRouter>,
    )
    const nav = screen.getByRole('navigation', { name: 'Teacher' })
    expect(nav).toHaveStyle({ height: '34px', paddingInline: '2px', paddingBlock: '2px' })
    expect(nav.querySelector('[data-segmented-track]')).toHaveStyle({ top: '0px', height: '34px', borderRadius: '9px' })

    const current = within(nav).getByRole('link', { name: 'Requests' })
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(current).toHaveStyle({ height: '30px' })
    expect(current.querySelector('[data-segment-face]')).toHaveStyle({
      height: '30px',
      fontSize: '14px',
      paddingInline: '12px',
      borderRadius: '7px',
    })
    expect(within(nav).getByRole('link', { name: 'Availability' })).not.toHaveAttribute('aria-current')
  })

  it('gives a phone 44-high segments while the control is still drawn 30 high', () => {
    render(
      <MemoryRouter>
        <SegmentedNav
          label="Teacher"
          activeIndex={0}
          hitHeight={44}
          items={[
            { to: '/tutor', label: 'Requests' },
            { to: '/tutor/availability', label: 'Availability' },
          ]}
        />
      </MemoryRouter>,
    )
    const nav = screen.getByRole('navigation', { name: 'Teacher' })
    expect(nav).toHaveStyle({ height: '44px', paddingBlock: '0px' })
    expect(nav.querySelector('[data-segmented-track]')).toHaveStyle({ top: '5px', height: '34px' })
    for (const link of within(nav).getAllByRole('link')) {
      expect(link).toHaveStyle({ height: '44px' })
      expect(link.querySelector('[data-segment-face]')).toHaveStyle({ height: '30px' })
    }
  })

  it('filters at 28 and says which filter is on', async () => {
    function Filter() {
      const [value, setValue] = useState<'all' | 'pending'>('all')
      return (
        <SegmentedFilter
          label="Status"
          value={value}
          onChange={setValue}
          options={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
          ]}
        />
      )
    }
    render(<Filter />)
    const group = screen.getByRole('group', { name: 'Status' })
    const pending = within(group).getByRole('button', { name: 'Pending' })

    expect(pending.querySelector('[data-segment-face]')).toHaveStyle({ height: '28px' })
    expect(pending).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(pending)
    expect(pending).toHaveAttribute('aria-pressed', 'true')
    expect(within(group).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('SearchField (Sizes: 36; 32 in toolbars, 38 on a page)', () => {
  it.each([
    ['toolbar', 32],
    ['default', 36],
    ['page', 38],
  ] as const)('is %s at %i, radius 10, magnifier 18', (size, height) => {
    const { container } = render(<SearchField label="Search students" size={size} />)
    const field = container.querySelector('[data-search-field]')

    expect(field).toHaveStyle({ height: px(height), borderRadius: '10px' })
    expect(field?.querySelector('svg')).toHaveAttribute('width', '18')
    expect(screen.getByRole('searchbox', { name: 'Search students' })).toBeInTheDocument()
  })
})

describe('Row and Group (Sizes: list rows 48-64)', () => {
  const renderRow = (row: React.ReactNode) =>
    render(
      <MemoryRouter>
        <Group title="Account">{row}</Group>
      </MemoryRouter>,
    )

  it('is 52 by default and a link with a chevron when it navigates', () => {
    const { container } = renderRow(<Row title="Mathematics" to="/planet/math" />)
    const row = screen.getByRole('link', { name: 'Mathematics' })

    expect(row).toHaveStyle({ minHeight: '52px', paddingInline: '16px' })
    expect(row.querySelector('[data-chevron]')).not.toBeNull()
    expect(container.querySelector('[data-group]')).toHaveStyle({ borderRadius: '12px' })
  })

  it('is 48 in settings', () => {
    const { container } = renderRow(<Row title="App language" compact trailing="English" />)
    expect(container.querySelector('[data-row]')).toHaveStyle({ minHeight: '48px' })
  })

  it('is 56 with a subtitle', () => {
    const { container } = renderRow(<Row title="Mathematics" subtitle="14 topics" />)
    expect(container.querySelector('[data-row]')).toHaveStyle({ minHeight: '56px' })
  })

  it('is 64 with an avatar, the avatar 36', () => {
    const { container } = renderRow(
      <Row title="Lina Meier" subtitle="Grade 8" leading={{ kind: 'avatar', name: 'Lina Meier' }} />,
    )
    expect(container.querySelector('[data-row]')).toHaveStyle({ minHeight: '64px' })
    expect(container.querySelector('[data-avatar]')).toHaveStyle({ width: '36px' })
  })

  it('draws a leading icon as a 32 tile, and carries no chevron when it goes nowhere', () => {
    const { container } = renderRow(<Row title="Notifications" leading={{ kind: 'icon', icon: UserRound }} />)
    const tile = container.querySelector('[data-row] > span[aria-hidden="true"]')

    expect(tile).toHaveStyle({ width: '32px', height: '32px', borderRadius: '9px' })
    expect(container.querySelector('[data-chevron]')).toBeNull()
  })
})

describe('Pill (Sizes: 22, radius 11, text 12/600, pad 9)', () => {
  it.each(['accent', 'gold', 'green', 'neutral'] as const)('is the same shape as %s', (tone) => {
    render(<Pill tone={tone}>Pending</Pill>)
    expect(screen.getByText('Pending')).toHaveStyle({
      height: '22px',
      borderRadius: '11px',
      fontSize: '12px',
      fontWeight: '600',
      paddingInline: '9px',
    })
  })
})

describe('Toggle (Sizes: 26 x 44, knob 22)', () => {
  it('is a switch of the board size that flips', async () => {
    function Setting() {
      const [on, setOn] = useState(true)
      return <Toggle label="Notifications" checked={on} onCheckedChange={setOn} />
    }
    render(<Setting />)
    const toggle = screen.getByRole('switch', { name: 'Notifications' })

    expect(toggle).toHaveStyle({ width: '44px', height: '26px', borderRadius: '13px' })
    expect(toggle.querySelector('[data-knob]')).toHaveStyle({ width: '22px', height: '22px', top: '2px', left: '20px' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(toggle.querySelector('[data-knob]')).toHaveStyle({ left: '2px' })
  })

  it('draws the off track in the gated off colour, not the fill that vanishes under the knob', async () => {
    render(<Toggle label="Off" checked={false} onCheckedChange={() => {}} />)
    const toggle = screen.getByRole('switch', { name: 'Off' })

    // contrast-pairs.json holds --toggle-track-off at 3:1 against the knob and the row.
    expect(toggle.className).toContain('var(--toggle-track-off)')
    expect(toggle.className).not.toMatch(/\bbg-fill\b/)
    expect(toggle.querySelector('[data-knob]')?.className).toContain('bg-surface')
  })
})

describe('Progress (Sizes: 4 high, radius 4)', () => {
  it('is 4 high and says how far', () => {
    render(<Progress label="Mathematics" value={62} />)
    const bar = screen.getByRole('progressbar', { name: 'Mathematics' })

    expect(bar).toHaveStyle({ height: '4px', borderRadius: '4px' })
    expect(bar).toHaveAttribute('aria-valuenow', '62')
    expect(bar.firstElementChild).toHaveStyle({ width: '62%' })
  })

  it('keeps a value past either end on the track', () => {
    render(<Progress label="Overflow" value={140} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })
})

describe('Composer (Sizes: docked 46, full ~150)', () => {
  function Harness({ variant, onSubmit }: { variant: 'docked' | 'full'; onSubmit: (value: string) => void }) {
    const [value, setValue] = useState('')
    return (
      <Composer
        variant={variant}
        label="Ask"
        value={value}
        onChange={setValue}
        onSubmit={onSubmit}
        onAttach={() => {}}
      />
    )
  }

  it('docks at 46 with a 32 field, + 32 / 20 and send 32 / 18', () => {
    const { container } = render(<Harness variant="docked" onSubmit={() => {}} />)
    const form = container.querySelector('[data-composer="docked"]')

    expect(form).toHaveStyle({ height: '46px', borderRadius: '23px' })
    expect(screen.getByRole('textbox', { name: 'Ask' })).toHaveStyle({ height: '32px' })
    const attach = screen.getByRole('button', { name: 'composer.attach' })
    const send = screen.getByRole('button', { name: 'composer.send' })
    expect(attach).toHaveStyle({ width: '32px', height: '32px' })
    expect(attach.querySelector('svg')).toHaveAttribute('width', '20')
    expect(send).toHaveStyle({ width: '32px', height: '32px' })
    expect(send.querySelector('svg')).toHaveAttribute('width', '18')
  })

  it('opens full at ~150 with a 78 field and a 32 footer, radius 18', () => {
    const { container } = render(<Harness variant="full" onSubmit={() => {}} />)

    expect(container.querySelector('[data-composer="full"]')).toHaveStyle({ minHeight: '150px', borderRadius: '18px' })
    expect(screen.getByRole('textbox', { name: 'Ask' })).toHaveStyle({ height: '78px' })
    expect(container.querySelector('[data-composer-footer]')).toHaveStyle({ height: '32px' })
  })

  it('sends on Enter, breaks the line on Shift+Enter, and never sends nothing', async () => {
    const onSubmit = vi.fn()
    render(<Harness variant="docked" onSubmit={onSubmit} />)
    const field = screen.getByRole('textbox', { name: 'Ask' })
    const send = screen.getByRole('button', { name: 'composer.send' })

    expect(send).toBeDisabled()
    await userEvent.type(field, '   {Enter}')
    expect(onSubmit).not.toHaveBeenCalled()

    await userEvent.clear(field)
    await userEvent.type(field, 'Why divide both sides?{Shift>}{Enter}{/Shift}')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(send).toBeEnabled()
    await userEvent.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('Why divide both sides?\n')
  })

  it('does not send on the Enter that ends an input-method composition', () => {
    const onSubmit = vi.fn()
    render(<Harness variant="docked" onSubmit={onSubmit} />)
    const field = screen.getByRole('textbox', { name: 'Ask' })
    fireEvent.change(field, { target: { value: 'にほんご' } })

    fireEvent.keyDown(field, { key: 'Enter', keyCode: 229 })
    fireEvent.keyDown(field, { key: 'Enter', isComposing: true })
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.keyDown(field, { key: 'Enter', keyCode: 13 })
    expect(onSubmit).toHaveBeenCalledWith('にほんご')
  })
})
