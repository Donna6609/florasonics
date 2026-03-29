import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  React.useEffect(function() {
    var mq = window.matchMedia("(max-width: 767px)");
    function handler(e) { setIsMobile(e.matches); }
    mq.addEventListener("change", handler);
    return function() { mq.removeEventListener("change", handler); };
  }, []);
  return isMobile;
}

const MobileSelectCtx = React.createContext(null);

function MobileBottomSheet(props) {
  var value = props.value;
  var onValueChange = props.onValueChange;
  var placeholder = props.placeholder;
  var children = props.children;
  var triggerClassName = props.triggerClassName;
  var disabled = props.disabled;

  var open = React.useState(false);
  var isOpen = open[0];
  var setOpen = open[1];

  var items = React.useMemo(function() {
    var result = [];
    function walk(nodes) {
      React.Children.forEach(nodes, function(child) {
        if (!React.isValidElement(child)) return;
        if (child.props && child.props.children) {
          var type = child.type;
          var isItem = type === SelectItem || (typeof type === "function" && type.displayName === "SelectItem");
          if (isItem) {
            result.push({ value: child.props.value, label: child.props.children, disabled: child.props.disabled });
          } else {
            walk(child.props.children);
          }
        }
      });
    }
    walk(children);
    return result;
  }, [children]);

  var found = items.find(function(i) { return i.value === value; });
  var selectedLabel = found ? found.label : (placeholder || "Select...");

  return React.createElement(React.Fragment, null,
    React.createElement("button", {
     type: "button",
     disabled: disabled,
     onClick: function() { setOpen(true); },
     className: cn(
       "select-none flex min-h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
       triggerClassName
     )
    },
      React.createElement("span", { className: cn("line-clamp-1", !value && "text-muted-foreground") }, selectedLabel),
      React.createElement(ChevronDown, { className: "h-4 w-4 opacity-50 shrink-0" })
    ),
    React.createElement(AnimatePresence, null,
      isOpen && React.createElement(React.Fragment, null,
        React.createElement(motion.div, {
          key: "backdrop",
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.2 },
          className: "fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm",
          onClick: function() { setOpen(false); }
        }),
        React.createElement(motion.div, {
          key: "sheet",
          initial: { y: "100%" },
          animate: { y: 0 },
          exit: { y: "100%" },
          transition: { type: "spring", stiffness: 380, damping: 38 },
          className: "fixed bottom-0 left-0 right-0 z-[201] rounded-t-2xl bg-slate-900 border-t border-white/10",
          style: { paddingBottom: "env(safe-area-inset-bottom)" }
        },
          React.createElement("div", { className: "flex justify-center pt-3 pb-1" },
            React.createElement("div", { className: "w-10 h-1 rounded-full bg-white/20" })
          ),
          React.createElement("div", { className: "max-h-[60vh] overflow-y-auto py-2 px-2" },
            items.map(function(item) {
              return React.createElement("button", {
                 key: item.value,
                 type: "button",
                 disabled: item.disabled,
                 onClick: function() { onValueChange && onValueChange(item.value); setOpen(false); },
                 className: cn(
                   "select-none w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900 focus-visible:ring-white/50",
                   item.disabled && "opacity-40 pointer-events-none",
                   item.value === value ? "bg-emerald-600/20 text-emerald-300" : "text-white/80 hover:bg-white/[0.08] active:bg-white/[0.12]"
                 )
               },
                React.createElement("span", { className: "flex-1 text-left" }, item.label),
                item.value === value && React.createElement(Check, { className: "w-4 h-4 shrink-0" })
              );
            })
          )
        )
      )
    )
  );
}

function Select(allProps) {
  var children = allProps.children;
  var value = allProps.value;
  var defaultValue = allProps.defaultValue;
  var onValueChange = allProps.onValueChange;
  var disabled = allProps.disabled;

  var isMobile = useIsMobile();
  var internal = React.useState(defaultValue != null ? defaultValue : "");
  var internalValue = internal[0];
  var setInternalValue = internal[1];
  var controlled = value !== undefined;
  var currentValue = controlled ? value : internalValue;

  function handleChange(v) {
    if (!controlled) setInternalValue(v);
    if (onValueChange) onValueChange(v);
  }

  if (isMobile) {
    var triggerClassName = "";
    var placeholder = "";
    var contentChildren = null;

    React.Children.forEach(children, function(child) {
      if (!React.isValidElement(child)) return;
      if (child.type === SelectTrigger) {
        triggerClassName = child.props.className || "";
        React.Children.forEach(child.props.children, function(c) {
          if (React.isValidElement(c) && c.type === SelectValue) {
            placeholder = c.props.placeholder || "";
          }
        });
      }
      if (child.type === SelectContent) {
        contentChildren = child.props.children;
      }
    });

    return React.createElement(
      MobileSelectCtx.Provider,
      { value: { value: currentValue, onValueChange: handleChange } },
      React.createElement(MobileBottomSheet, {
        value: currentValue,
        onValueChange: handleChange,
        placeholder: placeholder,
        triggerClassName: triggerClassName,
        disabled: disabled
      }, contentChildren)
    );
  }

  return React.createElement(
    SelectPrimitive.Root,
    { value: controlled ? value : undefined, defaultValue: !controlled ? defaultValue : undefined, onValueChange: onValueChange, disabled: disabled },
    children
  );
}

const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef(function SelectTrigger(props, ref) {
  var className = props.className;
  var children = props.children;
  var rest = Object.assign({}, props);
  delete rest.className;
  delete rest.children;

  var isMobile = useIsMobile();
  if (isMobile) return null;
  return React.createElement(
    SelectPrimitive.Trigger,
    Object.assign({ ref: ref, className: cn("select-none flex min-h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className) }, rest),
    children,
    React.createElement(SelectPrimitive.Icon, { asChild: true },
      React.createElement(ChevronDown, { className: "h-4 w-4 opacity-50" })
    )
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectScrollUpButton = React.forwardRef(function SelectScrollUpButton(props, ref) {
  var className = props.className;
  var rest = Object.assign({}, props);
  delete rest.className;
  return React.createElement(SelectPrimitive.ScrollUpButton, Object.assign({ ref: ref, className: cn("flex cursor-pointer items-center justify-center py-1", className) }, rest),
    React.createElement(ChevronDown, { className: "h-4 w-4 rotate-180" })
  );
});
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef(function SelectScrollDownButton(props, ref) {
  var className = props.className;
  var rest = Object.assign({}, props);
  delete rest.className;
  return React.createElement(SelectPrimitive.ScrollDownButton, Object.assign({ ref: ref, className: cn("flex cursor-pointer items-center justify-center py-1", className) }, rest),
    React.createElement(ChevronDown, { className: "h-4 w-4" })
  );
});
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef(function SelectContent(props, ref) {
  var className = props.className;
  var children = props.children;
  var position = props.position !== undefined ? props.position : "popper";
  var rest = Object.assign({}, props);
  delete rest.className;
  delete rest.children;
  delete rest.position;

  var isMobile = useIsMobile();
  if (isMobile) return null;
  return React.createElement(SelectPrimitive.Portal, null,
    React.createElement(SelectPrimitive.Content,
      Object.assign({ ref: ref, className: cn("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-input bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className), position: position }, rest),
      React.createElement(SelectScrollUpButton, null),
      React.createElement(SelectPrimitive.Viewport, { className: cn("p-1", position === "popper" && "h-[var(--radix-select-content-available-height)]") }, children),
      React.createElement(SelectScrollDownButton, null)
    )
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef(function SelectItem(props, ref) {
  var className = props.className;
  var children = props.children;
  var rest = Object.assign({}, props);
  delete rest.className;
  delete rest.children;

  var isMobile = useIsMobile();
  if (isMobile) return null;
  return React.createElement(SelectPrimitive.Item,
    Object.assign({ ref: ref, className: cn("relative flex w-full cursor-pointer select-none items-center rounded-sm min-h-11 py-2.5 pl-8 pr-2 text-sm outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-ring/50 focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className) }, rest),
    React.createElement("span", { className: "absolute left-2 flex h-4 w-4 items-center justify-center" },
      React.createElement(SelectPrimitive.ItemIndicator, null,
        React.createElement(Check, { className: "h-4 w-4" })
      )
    ),
    React.createElement(SelectPrimitive.ItemText, null, children)
  );
});
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef(function SelectSeparator(props, ref) {
  var className = props.className;
  var rest = Object.assign({}, props);
  delete rest.className;
  return React.createElement(SelectPrimitive.Separator, Object.assign({ ref: ref, className: cn("-mx-1 my-1 h-px bg-muted", className) }, rest));
});
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};