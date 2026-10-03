import { useMemo } from "react";
import { PersonCellDisplay } from "../../../primitives/person-cell-display";
import {
  findPerson,
  useWorkspacePeople,
} from "../../../hooks/use-workspace-people";
import type { ID, PersonValue } from "src/types";

// "Created by" and "Edited by": read-only, resolved from the record page
// itself (ownerId / editedBy) against the workspace members. Nothing is
// stored in the row's values.

const noop = () => {};

function PersonRefCell({
  personId,
  unwrapped,
  className,
}: {
  personId: ID | null | undefined;
  unwrapped?: boolean;
  className?: string;
}) {
  const people = useWorkspacePeople();
  const value = useMemo<PersonValue[]>(() => {
    const person = findPerson(people, personId);
    return person ? [person] : [];
  }, [people, personId]);

  return (
    <div
      className={className ?? "db-cell"}
      data-wrap={unwrapped ? "false" : "true"}
    >
      <PersonCellDisplay
        value={value}
        people={people}
        onChange={noop}
        readonly
      />
    </div>
  );
}

export function CreatedByCell(props: {
  ownerId: ID | null | undefined;
  unwrapped?: boolean;
  className?: string;
}) {
  return (
    <PersonRefCell
      personId={props.ownerId}
      unwrapped={props.unwrapped}
      className={props.className}
    />
  );
}

/** Falls back to the creator for pages saved before "edited by" existed. */
export function EditedByCell(props: {
  editedBy: ID | null | undefined;
  ownerId: ID | null | undefined;
  unwrapped?: boolean;
  className?: string;
}) {
  return (
    <PersonRefCell
      personId={props.editedBy ?? props.ownerId}
      unwrapped={props.unwrapped}
      className={props.className}
    />
  );
}
