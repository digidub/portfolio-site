
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash$1(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash$1(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    function hasContext(key) {
        return get_current_component().$$.context.has(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                start_hydrating();
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            end_hydrating();
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const path = readable(location.pathname, (set) =>
      window.addEventListener('popstate', () => set(location.pathname))
    );
    const query = readable(location.search, (set) =>
      window.addEventListener('popstate', () => set(location.search))
    );
    const hash = readable(location.hash, (set) =>
      window.addEventListener('popstate', () => set(location.hash))
    );

    // Default options
    let options = {
      onClickReloadPrevent: true,
    };

    const router = {
      // Push state to history
      push: (href = '/') => {
        history.pushState({}, null, href);
        window.dispatchEvent(new Event('popstate'));
      },

      // Replace state in history
      replace: (href = '/') => {
        history.replaceState({}, null, href);
        window.dispatchEvent(new Event('popstate'));
      },

      // Set router options
      setOptions: (changedOptions = {}) => Object.assign(options, changedOptions),
    };

    // Path to array function
    const pathToArray = (path) => {
      let pathArray = path.split('/').filter((path) => path !== '');

      for (let i = 0; i < pathArray.length; i++) {
        pathArray[i] = '/' + pathArray[i];
      }

      return pathArray;
    };

    // Get route depth function
    const getRouteDepth = (fallback, path, contextRouteDepth) => {
      return (!fallback ? pathToArray(path).length : 1) + (contextRouteDepth ?? 0);
    };

    // Is route active function
    const isRouteActive = (globalPath, route, contextChildRoutes) => {
      // Is fallback active function
      const isFallbackActive = (globalPath, route, contextChildRoutes) => {
        let hasContextActiveRoutes = false;

        for (let i = 0; i < contextChildRoutes?.length; i++) {
          hasContextActiveRoutes =
            contextChildRoutes[i] &&
            !contextChildRoutes[i]?.fallback &&
            isPathActive(globalPath, contextChildRoutes[i]);

          if (hasContextActiveRoutes) break;
        }

        return pathToArray(globalPath).length >= route.depth && !hasContextActiveRoutes;
      };

      // Is path active function
      const isPathActive = (globalPath, route) => {
        if (route.path === '/') {
          return route.root || pathToArray(globalPath).length === route.depth;
        } else {
          let routePathScope = '';

          for (let i = route.depth - pathToArray(route.path).length; i < route.depth; i++) {
            routePathScope = routePathScope + pathToArray(globalPath)[i];
          }

          return route.path === routePathScope;
        }
      };

      return route.fallback ? isFallbackActive(globalPath, route, contextChildRoutes) : isPathActive(globalPath, route);
    };

    // Reload prevent function
    const linkReloadPrevent = (e) => {
      let target = e.target.closest('a[href]');
      let isTargetInvalid =
        target === null ||
        target.nodeName !== 'A' ||
        target.getAttribute('external-href') === '' ||
        target.getAttribute('external-href') === 'true' ||
        target.getAttribute('href').substring(0, 7) === 'http://' ||
        target.getAttribute('href').substring(0, 8) === 'https://' ||
        target.getAttribute('href').substring(0, 2) === '//' ||
        target.getAttribute('href').substring(0, 7) === 'mailto:' ||
        target.getAttribute('href').substring(0, 4) === 'tel:';

      if (isTargetInvalid) return;

      if (target?.getAttribute('href') === get_store_value(path)) {
        router.replace(target?.getAttribute('href'));
      } else {
        router.push(target?.getAttribute('href'));
      }

      e.preventDefault();
    };

    // onClick reload prevent
    window.onclick = (e) => (options.onClickReloadPrevent ? linkReloadPrevent(e) : true);

    // Initial subscription
    path.subscribe(() => { });
    query.subscribe(() => { });
    hash.subscribe(() => { });

    /* node_modules/svelte-micro/src/components/Route.svelte generated by Svelte v3.38.3 */

    const { Error: Error_1 } = globals;

    // (49:0) {#if isRouteActive($globalPath, $route, $contextChildRoutes)}
    function create_if_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], !current ? -1 : dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(49:0) {#if isRouteActive($globalPath, $route, $contextChildRoutes)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let show_if = isRouteActive(/*$globalPath*/ ctx[2], /*$route*/ ctx[0], /*$contextChildRoutes*/ ctx[1]);
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$globalPath, $route, $contextChildRoutes*/ 7) show_if = isRouteActive(/*$globalPath*/ ctx[2], /*$route*/ ctx[0], /*$contextChildRoutes*/ ctx[1]);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$globalPath, $route, $contextChildRoutes*/ 7) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $contextChildRoutes;
    	let $contextRoute;
    	let $route;
    	let $globalPath;
    	validate_store(path, "globalPath");
    	component_subscribe($$self, path, $$value => $$invalidate(2, $globalPath = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Route", slots, ['default']);
    	let { fallback = false } = $$props;
    	let { path: path$1 = "/" } = $$props;
    	const root = !hasContext("contextRoute");
    	const route = writable({});
    	validate_store(route, "route");
    	component_subscribe($$self, route, value => $$invalidate(0, $route = value));
    	const childRoutes = writable([]);
    	const contextRoute = getContext("contextRoute");
    	validate_store(contextRoute, "contextRoute");
    	component_subscribe($$self, contextRoute, value => $$invalidate(8, $contextRoute = value));
    	const contextChildRoutes = getContext("contextChildRoutes");
    	validate_store(contextChildRoutes, "contextChildRoutes");
    	component_subscribe($$self, contextChildRoutes, value => $$invalidate(1, $contextChildRoutes = value));
    	const contextRouteIndex = $contextChildRoutes?.length;
    	onDestroy(() => !root && set_store_value(contextChildRoutes, $contextChildRoutes[contextRouteIndex] = null, $contextChildRoutes));

    	// Context for child routes
    	setContext("contextRoute", route);

    	setContext("contextChildRoutes", childRoutes);
    	const writable_props = ["fallback", "path"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Route> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("fallback" in $$props) $$invalidate(6, fallback = $$props.fallback);
    		if ("path" in $$props) $$invalidate(7, path$1 = $$props.path);
    		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		getContext,
    		setContext,
    		hasContext,
    		writable,
    		globalPath: path,
    		getRouteDepth,
    		isRouteActive,
    		fallback,
    		path: path$1,
    		root,
    		route,
    		childRoutes,
    		contextRoute,
    		contextChildRoutes,
    		contextRouteIndex,
    		$contextChildRoutes,
    		$contextRoute,
    		$route,
    		$globalPath
    	});

    	$$self.$inject_state = $$props => {
    		if ("fallback" in $$props) $$invalidate(6, fallback = $$props.fallback);
    		if ("path" in $$props) $$invalidate(7, path$1 = $$props.path);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*path, fallback, $contextRoute*/ 448) {
    			// Errors
    			{
    				if (path$1.substring(0, 1) !== "/") throw new Error(`'${path$1}' is invalid path. Route path must start from '/'`);
    				if (root && fallback === true) throw new Error(`<Route fallback> cannot be outside root <Route>`);
    				if (root && path$1 !== "/") throw new Error(`<Route path="${path$1}"> cannot be outside root <Route>`);
    				if (!root && $contextRoute.fallback) throw new Error(`Routes cannot be inside <Route fallback>`);
    			}
    		}

    		if ($$self.$$.dirty & /*fallback, path, $contextRoute*/ 448) {
    			// Route data
    			set_store_value(
    				route,
    				$route = {
    					root,
    					fallback,
    					path: path$1,
    					depth: getRouteDepth(fallback, path$1, $contextRoute?.depth)
    				},
    				$route
    			);
    		}

    		if ($$self.$$.dirty & /*$route*/ 1) {
    			// Context childRoutes update
    			!root && set_store_value(contextChildRoutes, $contextChildRoutes[contextRouteIndex] = $route, $contextChildRoutes);
    		}
    	};

    	return [
    		$route,
    		$contextChildRoutes,
    		$globalPath,
    		route,
    		contextRoute,
    		contextChildRoutes,
    		fallback,
    		path$1,
    		$contextRoute,
    		$$scope,
    		slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { fallback: 6, path: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get fallback() {
    		throw new Error_1("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fallback(value) {
    		throw new Error_1("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get path() {
    		throw new Error_1("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error_1("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    /* src/Components/PageSlide.svelte generated by Svelte v3.38.3 */
    const file$8 = "src/Components/PageSlide.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let div_intro;
    	let div_outro;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			add_location(div, file$8, 21, 0, 359);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], !current ? -1 : dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, /*transitionIn*/ ctx[0], {});
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, /*transitionOut*/ ctx[1], {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PageSlide", slots, ['default']);
    	let duration = 250;
    	let delay = duration;

    	const transitionIn = () => ({
    		duration,
    		delay,
    		easing: cubicInOut,
    		css: t => `opacity: ${t}`
    	});

    	const transitionOut = () => ({
    		duration,
    		delay: 0,
    		easing: cubicInOut,
    		css: t => `opacity: ${t}`
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PageSlide> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		cubicInOut,
    		duration,
    		delay,
    		transitionIn,
    		transitionOut
    	});

    	$$self.$inject_state = $$props => {
    		if ("duration" in $$props) duration = $$props.duration;
    		if ("delay" in $$props) delay = $$props.delay;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [transitionIn, transitionOut, $$scope, slots];
    }

    class PageSlide extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PageSlide",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/Contact.svelte generated by Svelte v3.38.3 */
    const file$7 = "src/Contact.svelte";

    // (5:0) <PageSlide>
    function create_default_slot$4(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Contact";
    			t1 = space();
    			div = element("div");
    			p = element("p");
    			p.textContent = "contact me";
    			attr_dev(h1, "class", "page-intro svelte-xt7xrd");
    			add_location(h1, file$7, 6, 4, 102);
    			add_location(p, file$7, 8, 6, 170);
    			attr_dev(div, "class", "contact svelte-xt7xrd");
    			add_location(div, file$7, 7, 4, 142);
    			add_location(main, file$7, 5, 2, 91);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div);
    			append_dev(div, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(5:0) <PageSlide>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let pageslide;
    	let current;

    	pageslide = new PageSlide({
    			props: {
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pageslide.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(pageslide, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const pageslide_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				pageslide_changes.$$scope = { dirty, ctx };
    			}

    			pageslide.$set(pageslide_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pageslide.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pageslide.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pageslide, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Contact", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ PageSlide });
    	return [];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/Cv.svelte generated by Svelte v3.38.3 */
    const file$6 = "src/Cv.svelte";

    // (6:0) <PageSlide>
    function create_default_slot$3(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "CV";
    			t1 = space();
    			div = element("div");
    			p = element("p");
    			p.textContent = "My CV";
    			attr_dev(h1, "class", "page-intro svelte-1tnfdlg");
    			add_location(h1, file$6, 7, 4, 145);
    			add_location(p, file$6, 9, 6, 203);
    			attr_dev(div, "class", "cv svelte-1tnfdlg");
    			add_location(div, file$6, 8, 4, 180);
    			add_location(main, file$6, 6, 2, 134);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div);
    			append_dev(div, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(6:0) <PageSlide>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let pageslide;
    	let current;

    	pageslide = new PageSlide({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pageslide.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(pageslide, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const pageslide_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				pageslide_changes.$$scope = { dirty, ctx };
    			}

    			pageslide.$set(pageslide_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pageslide.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pageslide.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pageslide, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Cv", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cv> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fly, PageSlide });
    	return [];
    }

    class Cv extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cv",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const t$5=(t,e)=>{const n=document.createElement(e);return n.textContent=t,n};

    const e$4=e=>1===e.childNodes.length&&3===e.childNodes[0].nodeType;

    const n$2=n=>{if(e$4(n)){const e=n.textContent,r=t$5(n.textContent,"p");return n.textContent="",n.appendChild(r),[{currentNode:r,text:e}]}return [...n.children].map((t=>{const e=t.innerHTML.replaceAll("&amp;","&");return {currentNode:t,text:e}}))};

    const t$4=async(t,o)=>{const{mode:s}=(o.loop||o.loopRandom)&&await Promise.resolve().then(function () { return loopTypewriter; })||o.scramble&&await Promise.resolve().then(function () { return scramble; })||await Promise.resolve().then(function () { return typewriter; }),a=n$2(t);if(o.delay>0){const{sleep:e}=await Promise.resolve().then(function () { return index; });await e(o.delay),t.classList.remove("delay");}s({node:t,elements:a},o);};

    /* node_modules/svelte-typewriter/lib/Typewriter.svelte generated by Svelte v3.38.3 */
    const file$5 = "node_modules/svelte-typewriter/lib/Typewriter.svelte";

    // (57:0) {#key reinit}
    function create_key_block(ctx) {
    	let div;
    	let typewriter_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "typewriter-container svelte-1xd0fu9");

    			set_style(div, "--cursor-color", typeof /*cursor*/ ctx[0] === "string"
    			? /*cursor*/ ctx[0]
    			: "black");

    			toggle_class(div, "cursor", /*cursor*/ ctx[0]);
    			toggle_class(div, "delay", /*options*/ ctx[2].delay > 0);
    			add_location(div, file$5, 57, 2, 1092);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(typewriter_action = t$4.call(null, div, /*options*/ ctx[2]));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], !current ? -1 : dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*cursor*/ 1) {
    				set_style(div, "--cursor-color", typeof /*cursor*/ ctx[0] === "string"
    				? /*cursor*/ ctx[0]
    				: "black");
    			}

    			if (typewriter_action && is_function(typewriter_action.update) && dirty & /*options*/ 4) typewriter_action.update.call(null, /*options*/ ctx[2]);

    			if (dirty & /*cursor*/ 1) {
    				toggle_class(div, "cursor", /*cursor*/ ctx[0]);
    			}

    			if (dirty & /*options*/ 4) {
    				toggle_class(div, "delay", /*options*/ ctx[2].delay > 0);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(57:0) {#key reinit}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let previous_key = /*reinit*/ ctx[1];
    	let key_block_anchor;
    	let current;
    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*reinit*/ 2 && safe_not_equal(previous_key, previous_key = /*reinit*/ ctx[1])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let options;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Typewriter", slots, ['default']);
    	let { interval = 30 } = $$props;
    	let { cascade = false } = $$props;
    	let { loop = false } = $$props;
    	let { loopRandom = false } = $$props;
    	let { scramble = false } = $$props;
    	let { cursor = true } = $$props;
    	let { delay = 0 } = $$props;
    	let isMounted = false;
    	let reinit = {};
    	const dispatch = createEventDispatcher();
    	beforeUpdate(() => isMounted && $$invalidate(1, reinit = {}));
    	onMount(() => isMounted = true);
    	const writable_props = ["interval", "cascade", "loop", "loopRandom", "scramble", "cursor", "delay"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Typewriter> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("interval" in $$props) $$invalidate(3, interval = $$props.interval);
    		if ("cascade" in $$props) $$invalidate(4, cascade = $$props.cascade);
    		if ("loop" in $$props) $$invalidate(5, loop = $$props.loop);
    		if ("loopRandom" in $$props) $$invalidate(6, loopRandom = $$props.loopRandom);
    		if ("scramble" in $$props) $$invalidate(7, scramble = $$props.scramble);
    		if ("cursor" in $$props) $$invalidate(0, cursor = $$props.cursor);
    		if ("delay" in $$props) $$invalidate(8, delay = $$props.delay);
    		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		onDestroy,
    		createEventDispatcher,
    		typewriter: t$4,
    		interval,
    		cascade,
    		loop,
    		loopRandom,
    		scramble,
    		cursor,
    		delay,
    		isMounted,
    		reinit,
    		dispatch,
    		options
    	});

    	$$self.$inject_state = $$props => {
    		if ("interval" in $$props) $$invalidate(3, interval = $$props.interval);
    		if ("cascade" in $$props) $$invalidate(4, cascade = $$props.cascade);
    		if ("loop" in $$props) $$invalidate(5, loop = $$props.loop);
    		if ("loopRandom" in $$props) $$invalidate(6, loopRandom = $$props.loopRandom);
    		if ("scramble" in $$props) $$invalidate(7, scramble = $$props.scramble);
    		if ("cursor" in $$props) $$invalidate(0, cursor = $$props.cursor);
    		if ("delay" in $$props) $$invalidate(8, delay = $$props.delay);
    		if ("isMounted" in $$props) isMounted = $$props.isMounted;
    		if ("reinit" in $$props) $$invalidate(1, reinit = $$props.reinit);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*interval, cascade, loop, loopRandom, scramble, cursor, delay*/ 505) {
    			$$invalidate(2, options = {
    				interval,
    				cascade,
    				loop,
    				loopRandom,
    				scramble,
    				cursor,
    				delay,
    				dispatch
    			});
    		}
    	};

    	return [
    		cursor,
    		reinit,
    		options,
    		interval,
    		cascade,
    		loop,
    		loopRandom,
    		scramble,
    		delay,
    		$$scope,
    		slots
    	];
    }

    class Typewriter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			interval: 3,
    			cascade: 4,
    			loop: 5,
    			loopRandom: 6,
    			scramble: 7,
    			cursor: 0,
    			delay: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Typewriter",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get interval() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set interval(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cascade() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cascade(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loop() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loop(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loopRandom() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loopRandom(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scramble() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scramble(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cursor() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cursor(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get delay() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set delay(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Home.svelte generated by Svelte v3.38.3 */
    const file$4 = "src/Home.svelte";

    // (9:4) <Typewriter cascade>
    function create_default_slot_1$1(ctx) {
    	let h1;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let div;
    	let section0;
    	let h20;
    	let t4;
    	let p0;
    	let t6;
    	let section1;
    	let h21;
    	let t8;
    	let p1;
    	let t10;
    	let section2;
    	let h22;
    	let t12;
    	let p2;
    	let t14;
    	let section3;
    	let h23;
    	let t16;
    	let p3;
    	let t17;
    	let a;
    	let t19;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("I taught myself to build websites,\n        ");
    			br = element("br");
    			t1 = text("such as this one.");
    			t2 = space();
    			div = element("div");
    			section0 = element("section");
    			h20 = element("h2");
    			h20.textContent = "I'm a front-end web developer.";
    			t4 = space();
    			p0 = element("p");
    			p0.textContent = "HTML5, CSS3, JavaScript, React, Svelte";
    			t6 = space();
    			section1 = element("section");
    			h21 = element("h2");
    			h21.textContent = "...and I also know how things work under the hood.";
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "NPM, Webpack, Git";
    			t10 = space();
    			section2 = element("section");
    			h22 = element("h2");
    			h22.textContent = "I'm enthused about learning more";
    			t12 = space();
    			p2 = element("p");
    			p2.textContent = "Node.js, Test-driven development";
    			t14 = space();
    			section3 = element("section");
    			h23 = element("h2");
    			h23.textContent = "And I'm ready to offer my skills";
    			t16 = space();
    			p3 = element("p");
    			t17 = text("Why not check out my ");
    			a = element("a");
    			a.textContent = "portfolio";
    			t19 = text("?");
    			add_location(br, file$4, 11, 8, 293);
    			attr_dev(h1, "class", "page-intro svelte-1g7sd09");
    			add_location(h1, file$4, 9, 6, 218);
    			add_location(h20, file$4, 16, 10, 385);
    			add_location(p0, file$4, 17, 10, 435);
    			add_location(section0, file$4, 15, 8, 365);
    			add_location(h21, file$4, 20, 10, 528);
    			add_location(p1, file$4, 21, 10, 598);
    			add_location(section1, file$4, 19, 8, 508);
    			add_location(h22, file$4, 24, 10, 670);
    			add_location(p2, file$4, 25, 10, 722);
    			add_location(section2, file$4, 23, 8, 650);
    			add_location(h23, file$4, 28, 10, 809);
    			attr_dev(a, "href", "/projects");
    			attr_dev(a, "class", "svelte-1g7sd09");
    			add_location(a, file$4, 29, 34, 885);
    			add_location(p3, file$4, 29, 10, 861);
    			add_location(section3, file$4, 27, 8, 789);
    			attr_dev(div, "class", "skills svelte-1g7sd09");
    			add_location(div, file$4, 14, 6, 336);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, br);
    			append_dev(h1, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, section0);
    			append_dev(section0, h20);
    			append_dev(section0, t4);
    			append_dev(section0, p0);
    			append_dev(div, t6);
    			append_dev(div, section1);
    			append_dev(section1, h21);
    			append_dev(section1, t8);
    			append_dev(section1, p1);
    			append_dev(div, t10);
    			append_dev(div, section2);
    			append_dev(section2, h22);
    			append_dev(section2, t12);
    			append_dev(section2, p2);
    			append_dev(div, t14);
    			append_dev(div, section3);
    			append_dev(section3, h23);
    			append_dev(section3, t16);
    			append_dev(section3, p3);
    			append_dev(p3, t17);
    			append_dev(p3, a);
    			append_dev(p3, t19);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(9:4) <Typewriter cascade>",
    		ctx
    	});

    	return block;
    }

    // (7:0) <PageSlide>
    function create_default_slot$2(ctx) {
    	let main;
    	let typewriter;
    	let current;

    	typewriter = new Typewriter({
    			props: {
    				cascade: true,
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(typewriter.$$.fragment);
    			add_location(main, file$4, 7, 2, 180);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(typewriter, main, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const typewriter_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				typewriter_changes.$$scope = { dirty, ctx };
    			}

    			typewriter.$set(typewriter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(typewriter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(typewriter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(typewriter);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(7:0) <PageSlide>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let pageslide;
    	let current;

    	pageslide = new PageSlide({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pageslide.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(pageslide, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const pageslide_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				pageslide_changes.$$scope = { dirty, ctx };
    			}

    			pageslide.$set(pageslide_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pageslide.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pageslide.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pageslide, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fly, PageSlide, Typewriter });
    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Components/ProjectCard.svelte generated by Svelte v3.38.3 */

    const file$3 = "src/Components/ProjectCard.svelte";

    function create_fragment$3(ctx) {
    	let div3;
    	let div0;
    	let h1;
    	let t1;
    	let div1;
    	let p;
    	let t3;
    	let div2;
    	let a;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Shopping-cart";
    			t1 = space();
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "A responsive shopping-cart built using React and styled components. Read the full writeup on GitHub, and check the project out!";
    			t3 = space();
    			div2 = element("div");
    			a = element("a");
    			img = element("img");
    			attr_dev(h1, "class", "card-title svelte-u3dgqg");
    			add_location(h1, file$3, 6, 4, 119);
    			attr_dev(div0, "class", "card-header svelte-u3dgqg");
    			add_location(div0, file$3, 5, 2, 89);
    			attr_dev(p, "class", "description svelte-u3dgqg");
    			add_location(p, file$3, 9, 4, 200);
    			attr_dev(div1, "class", "card-body");
    			add_location(div1, file$3, 8, 2, 172);
    			if (img.src !== (img_src_value = "/assets/GitHub.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "GH logo");
    			add_location(img, file$3, 13, 79, 455);
    			attr_dev(a, "href", "https://github.com/digidub/shopping-cart2");
    			add_location(a, file$3, 13, 27, 403);
    			attr_dev(div2, "class", "card-footer");
    			add_location(div2, file$3, 13, 2, 378);
    			attr_dev(div3, "class", "card svelte-u3dgqg");
    			add_location(div3, file$3, 4, 0, 68);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, h1);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, p);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, a);
    			append_dev(a, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProjectCard", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProjectCard> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ProjectCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectCard",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Projects.svelte generated by Svelte v3.38.3 */
    const file$2 = "src/Projects.svelte";

    // (7:0) <PageSlide>
    function create_default_slot$1(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div;
    	let card;
    	let current;
    	card = new ProjectCard({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Projects";
    			t1 = space();
    			div = element("div");
    			create_component(card.$$.fragment);
    			attr_dev(h1, "class", "page-intro svelte-1hkbpmh");
    			add_location(h1, file$2, 8, 4, 199);
    			attr_dev(div, "class", "projects svelte-1hkbpmh");
    			add_location(div, file$2, 9, 4, 240);
    			add_location(main, file$2, 7, 2, 188);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div);
    			mount_component(card, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(card);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(7:0) <PageSlide>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let pageslide;
    	let current;

    	pageslide = new PageSlide({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pageslide.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(pageslide, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const pageslide_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				pageslide_changes.$$scope = { dirty, ctx };
    			}

    			pageslide.$set(pageslide_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pageslide.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pageslide.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pageslide, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Projects", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fly, PageSlide, Card: ProjectCard });
    	return [];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Header.svelte generated by Svelte v3.38.3 */
    const file$1 = "src/Header.svelte";

    // (21:2) <Route path="/">
    function create_default_slot_5(ctx) {
    	let home;
    	let current;
    	home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(21:2) <Route path=\\\"/\\\">",
    		ctx
    	});

    	return block;
    }

    // (23:2) <Route path="/cv">
    function create_default_slot_4(ctx) {
    	let cv;
    	let current;
    	cv = new Cv({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(cv.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cv, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cv.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cv.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cv, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(23:2) <Route path=\\\"/cv\\\">",
    		ctx
    	});

    	return block;
    }

    // (27:2) <Route path="/projects">
    function create_default_slot_3(ctx) {
    	let projects;
    	let current;
    	projects = new Projects({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(projects.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(projects, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(projects.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(projects.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(projects, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(27:2) <Route path=\\\"/projects\\\">",
    		ctx
    	});

    	return block;
    }

    // (31:2) <Route path="/contact">
    function create_default_slot_2(ctx) {
    	let contact;
    	let current;
    	contact = new Contact({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(contact.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(contact, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contact.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contact.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(contact, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(31:2) <Route path=\\\"/contact\\\">",
    		ctx
    	});

    	return block;
    }

    // (35:2) <Route fallback>
    function create_default_slot_1(ctx) {
    	let h1;
    	let t1;
    	let a;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Page not found :(";
    			t1 = space();
    			a = element("a");
    			a.textContent = "Back to home";
    			add_location(h1, file$1, 35, 4, 723);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "svelte-awmbjn");
    			add_location(a, file$1, 36, 4, 754);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(35:2) <Route fallback>",
    		ctx
    	});

    	return block;
    }

    // (9:0) <Route>
    function create_default_slot(ctx) {
    	let header;
    	let a0;
    	let t1;
    	let nav;
    	let ul;
    	let li0;
    	let a1;
    	let t3;
    	let li1;
    	let a2;
    	let t5;
    	let li2;
    	let a3;
    	let t7;
    	let route0;
    	let t8;
    	let route1;
    	let t9;
    	let route2;
    	let t10;
    	let route3;
    	let t11;
    	let route4;
    	let current;

    	route0 = new Route({
    			props: {
    				path: "/",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route1 = new Route({
    			props: {
    				path: "/cv",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route2 = new Route({
    			props: {
    				path: "/projects",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route3 = new Route({
    			props: {
    				path: "/contact",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	route4 = new Route({
    			props: {
    				fallback: true,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			a0 = element("a");
    			a0.textContent = "Alex Cox";
    			t1 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Cv";
    			t3 = space();
    			li1 = element("li");
    			a2 = element("a");
    			a2.textContent = "Projects";
    			t5 = space();
    			li2 = element("li");
    			a3 = element("a");
    			a3.textContent = "Contact";
    			t7 = space();
    			create_component(route0.$$.fragment);
    			t8 = space();
    			create_component(route1.$$.fragment);
    			t9 = space();
    			create_component(route2.$$.fragment);
    			t10 = space();
    			create_component(route3.$$.fragment);
    			t11 = space();
    			create_component(route4.$$.fragment);
    			attr_dev(a0, "class", "page-name svelte-awmbjn");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$1, 10, 4, 257);
    			attr_dev(a1, "href", "/cv");
    			attr_dev(a1, "class", "svelte-awmbjn");
    			add_location(a1, file$1, 13, 12, 350);
    			attr_dev(li0, "class", "svelte-awmbjn");
    			add_location(li0, file$1, 13, 8, 346);
    			attr_dev(a2, "href", "/projects");
    			attr_dev(a2, "class", "svelte-awmbjn");
    			add_location(a2, file$1, 14, 12, 388);
    			attr_dev(li1, "class", "svelte-awmbjn");
    			add_location(li1, file$1, 14, 8, 384);
    			attr_dev(a3, "href", "/contact");
    			attr_dev(a3, "class", "svelte-awmbjn");
    			add_location(a3, file$1, 15, 12, 438);
    			attr_dev(li2, "class", "svelte-awmbjn");
    			add_location(li2, file$1, 15, 8, 434);
    			attr_dev(ul, "class", "svelte-awmbjn");
    			add_location(ul, file$1, 12, 6, 333);
    			attr_dev(nav, "class", "page-nav svelte-awmbjn");
    			add_location(nav, file$1, 11, 4, 304);
    			attr_dev(header, "class", "page-header svelte-awmbjn");
    			add_location(header, file$1, 9, 2, 224);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, a0);
    			append_dev(header, t1);
    			append_dev(header, nav);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, a2);
    			append_dev(ul, t5);
    			append_dev(ul, li2);
    			append_dev(li2, a3);
    			insert_dev(target, t7, anchor);
    			mount_component(route0, target, anchor);
    			insert_dev(target, t8, anchor);
    			mount_component(route1, target, anchor);
    			insert_dev(target, t9, anchor);
    			mount_component(route2, target, anchor);
    			insert_dev(target, t10, anchor);
    			mount_component(route3, target, anchor);
    			insert_dev(target, t11, anchor);
    			mount_component(route4, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				route0_changes.$$scope = { dirty, ctx };
    			}

    			route0.$set(route0_changes);
    			const route1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				route1_changes.$$scope = { dirty, ctx };
    			}

    			route1.$set(route1_changes);
    			const route2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				route2_changes.$$scope = { dirty, ctx };
    			}

    			route2.$set(route2_changes);
    			const route3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				route3_changes.$$scope = { dirty, ctx };
    			}

    			route3.$set(route3_changes);
    			const route4_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				route4_changes.$$scope = { dirty, ctx };
    			}

    			route4.$set(route4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			transition_in(route3.$$.fragment, local);
    			transition_in(route4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
    			transition_out(route4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t7);
    			destroy_component(route0, detaching);
    			if (detaching) detach_dev(t8);
    			destroy_component(route1, detaching);
    			if (detaching) detach_dev(t9);
    			destroy_component(route2, detaching);
    			if (detaching) detach_dev(t10);
    			destroy_component(route3, detaching);
    			if (detaching) detach_dev(t11);
    			destroy_component(route4, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(9:0) <Route>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let route;
    	let current;

    	route = new Route({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(route, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const route_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				route_changes.$$scope = { dirty, ctx };
    			}

    			route.$set(route_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Route, Contact, Cv, Home, Projects });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.3 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div1;
    	let div0;
    	let header;
    	let current;
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(header.$$.fragment);
    			attr_dev(div0, "class", "wrapper svelte-10ggfod");
    			add_location(div0, file, 6, 2, 122);
    			attr_dev(div1, "class", "container svelte-10ggfod");
    			add_location(div1, file, 5, 0, 96);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(header, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header, Home });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    const o$4=(o,t)=>Math.floor(Math.random()*(t-o)+o);

    const e$3=e=>new Promise((o=>setTimeout(o,e)));

    const s$1=async s=>e$3(Array.isArray(s)?s[o$4(0,s.length)]:s);

    const n$1=async(n,t)=>{t.dispatch("done"),await s$1("number"==typeof t.loop?t.loop:1500);const o=n.innerHTML.replaceAll("&amp;","&");for(let a=o.length-1;a>=0;a--){">"===o[a]&&(a=o.lastIndexOf("<",a)),n.innerHTML=o.slice(0,a),await s$1(t.interval);}};

    const e$2=async({currentNode:e,text:i},n)=>{e.classList.add("typing");for(let s=0;s<=i.length;s++){"<"===i[s]&&(s=i.indexOf(">",s)),e.innerHTML=i.slice(0,s),await s$1(n.interval);}e.classList.replace("typing","finished-typing");};

    let t$3=[];const e$1=e=>{for(;;){const n=o$4(0,e.length),o="number"==typeof t$3&&n!==t$3;if(Array.isArray(t$3)&&!t$3.includes(n)||o){o&&(t$3=[]),t$3.push(n);return e[n]}t$3.length===e.length&&(t$3=t$3.pop());}};

    const r$1=async(o,{currentNode:r,text:n},a)=>{await e$2({currentNode:r,text:n},a);const s=n.replaceAll("&","&amp;");r.innerHTML===s&&await n$1(r,a);},n=async({node:e,elements:t},n)=>{for(;;)if(n.loop)for(const e of t)await r$1(0,e,n);else if(n.loopRandom){const e=e$1(t);await r$1(0,e,n);}};

    var loopTypewriter = /*#__PURE__*/Object.freeze({
        __proto__: null,
        mode: n
    });

    const o$3=(o,[t,c])=>o>=t&&o<=c;

    let t$2=[];const r=e=>t$2.find((n=>n.currentNode===e)),s=e=>{const t=(e=>{const n=/(<([^>]+)>)/g,t=[];let r;for(;null!==(r=n.exec(e.innerHTML));){const e=r.index,s=n.lastIndex;t.push([e,s-1]);}return t})(e),s=e.innerHTML.split("").map(((s,o)=>{const{matchingLetters:i}=r(e),a=i.includes(o)||s.match(/\s+/g)||((e,t)=>t.some((([t,r])=>o$3(e,[t,r]))))(o,t),c=String.fromCharCode(65+Math.round(50*Math.random()));return a?s:c})).join("");e.innerHTML=s;},o$2=(e,n)=>{const t=e.innerHTML;for(let s=0;s<n.length;s++){const o=n[s],{matchingLetters:i}=r(e);!i.includes(s)&&o===t[s]&&i.push(s);}},i=async({elements:n},r)=>{t$2=[...n.map((({currentNode:e})=>({currentNode:e,matchingLetters:[]})))],await new Promise((t=>{n.forEach((async({currentNode:n,text:i})=>{const a="number"==typeof r.scramble?r.scramble:3e3,c=(new Date).getTime();for(;;){s(n),o$2(n,i),await s$1(r.interval);const m=n.innerHTML!=i,l=(new Date).getTime()-c<a;if(!m||!l){t();break}}n.innerHTML=i;}));})),r.dispatch("done");};

    var scramble = /*#__PURE__*/Object.freeze({
        __proto__: null,
        mode: i
    });

    const t$1=(t,e)=>{new MutationObserver((t=>{t.forEach((t=>{const s="attributes"===t.type,r=!t.target.classList.contains("typing");s&&r&&e();}));})).observe(t,{attributes:!0,childList:!0,subtree:!0});};

    const o$1=async({elements:o},s)=>{if(s.cascade)(e=>{e.forEach((e=>e.currentNode.textContent=""));})(o);else {const{getLongestTextElement:e}=await Promise.resolve().then(function () { return index; }),n=e(o);t$1(n,(()=>s.dispatch("done")));}for(const t of o)s.cascade?await e$2(t,s):e$2(t,s);s.cascade&&s.dispatch("done");};

    var typewriter = /*#__PURE__*/Object.freeze({
        __proto__: null,
        mode: o$1
    });

    const o=o=>o.childNodes.forEach((o=>o.remove()));

    const t=(t,e)=>e.text.length-t.text.length,e=e=>e.sort(t)[0].currentNode;

    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        cleanChildNodes: o,
        createElement: t$5,
        getElements: n$2,
        hasSingleTextNode: e$4,
        rng: o$4,
        sleep: e$3,
        typingInterval: s$1,
        unwriteEffect: n$1,
        isInRange: o$3,
        writeEffect: e$2,
        getLongestTextElement: e,
        onAnimationEnd: t$1,
        getRandomElement: e$1
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
