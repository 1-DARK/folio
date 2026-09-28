import { Card } from "src/components/tiptap-ui-primitive/card";
import {
  StatusEditDisplay,
  type StatusPropertyProps,
} from "../../../../../../components/tiptap-node/inline-database/ui/status/status-edit-display";
import { PropertyEditPopover } from "../../../../../../components/tiptap-node/inline-database/components/property-edit-popover";

export function StatusProperty(props: StatusPropertyProps) {
  return (
    <Card>
      <PropertyEditPopover>
        <StatusEditDisplay {...props} />
      </PropertyEditPopover>
    </Card>
  );
}
