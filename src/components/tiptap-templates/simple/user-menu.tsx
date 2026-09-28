import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { LogOut, UserCircle } from "lucide-react";
import { Button } from "src/components/tiptap-ui-primitive/button";
import { Avatar } from "src/components/tiptap-ui-primitive/avatar";
import { useCurrentPerson } from "src/hooks/use-session";
import { supabase } from "src/api/supabase-client";
import { WorkspaceSettingsContext } from "./context/workspace-settings-context";
import "./user-menu.scss";

// The signed-in person's avatar, pinned to the far right of the toolbar.
// Click → a small menu: who you are, "Edit profile" (opens workspace
// settings on My account) and "Log out".
//
// Rendered through a portal with fixed positioning so the toolbar's own
// overflow / stacking never clips it.

const MENU_GAP = 6;

export function UserMenu() {
  const { t } = useTranslation();
  const { person } = useCurrentPerson();
  const settings = useContext(WorkspaceSettingsContext);

  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) anchorRef.current?.focus();
  }, []);

  // Place the menu under the avatar, right edges aligned.
  useLayoutEffect(() => {
    if (!open) return;
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPos({
      top: rect.bottom + MENU_GAP,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, [open]);

  // Outside click, Escape, resize → close. Focus the first item on open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      )
        return;
      close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    const onResize = () => close(false);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    requestAnimationFrame(() =>
      menuRef.current
        ?.querySelector<HTMLButtonElement>("[role='menuitem']")
        ?.focus(),
    );
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open, close]);

  // Arrow keys move between items.
  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        "[role='menuitem']:not(:disabled)",
      ) ?? [],
    );
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "ArrowDown"
        ? items[(i + 1) % items.length]
        : items[(i - 1 + items.length) % items.length];
    next.focus();
  };

  const editProfile = () => {
    close(false);
    settings?.openTo("my-account");
  };

  const logOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    // A normal sign-out also revokes the session on the server. Offline (or
    // if that call fails) fall back to a local sign-out: it needs no network
    // and still fires SIGNED_OUT, which clears the offline data and sends the
    // app back to the landing / sign-in screen.
    const { error } = await supabase.auth.signOut();
    if (error) await supabase.auth.signOut({ scope: "local" });
    setSigningOut(false);
    setOpen(false);
  };

  if (!person) return null;

  const avatarSrc = person.avatarUrl ?? undefined;

  return (
    <>
      <Button
        ref={anchorRef}
        variant="ghost"
        size="large"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("account.menu", "Account")}
        data-active={open}
        onClick={() => setOpen((v) => !v)}
        className="user-menu__trigger"
      >
        <Avatar size="sm" src={avatarSrc} name={person.name} />
      </Button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            className="user-menu"
            role="menu"
            aria-label={t("account.menu", "Account")}
            style={{ top: pos.top, right: pos.right }}
            onKeyDown={onMenuKeyDown}
          >
            <div className="user-menu__identity">
              <Avatar size="sm" src={avatarSrc} name={person.name} />
              <div className="user-menu__identity-text">
                <span className="user-menu__name">{person.name}</span>
                {person.email && (
                  <span className="user-menu__email">{person.email}</span>
                )}
              </div>
            </div>

            <div className="user-menu__separator" role="separator" />

            <button
              type="button"
              role="menuitem"
              className="user-menu__item"
              onClick={editProfile}
            >
              <UserCircle size={16} />
              <span>{t("account.editProfile", "Edit profile")}</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className="user-menu__item user-menu__item--danger"
              onClick={logOut}
              disabled={signingOut}
            >
              <LogOut size={16} />
              <span>{t("account.logOut", "Log out")}</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
