import { defineComponent, ref, computed, onMounted, onBeforeUnmount, type PropType } from 'vue'
import { NTimeline, NTimelineItem } from 'naive-ui'
import { useCamundaI18n } from '../../locales'
import type { ProcessExecutionState, ExecutionStatus } from './types'

const statusColor: Record<ExecutionStatus, string> = {
  active: '#2563eb',
  completed: '#16a34a',
  rejected: '#dc2626',
  pending: '#9ca3af',
}

const statusType: Record<ExecutionStatus, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
  active: 'info',
  completed: 'success',
  rejected: 'error',
  pending: 'default',
}

const bpmnBodies: Record<string, string> = {
  'start-event':
    '<path fill="currentColor" d="M1015.477 98.928C654.779 97.73 308.674 330.794 171.775 664.19c-144.118 330.153-69.237 740.284 182.862 997.772c242.463 260.992 641.949 356.786 976.52 234.672c346.739-118.074 602.723-458.594 616.638-825.092c23.34-360.13-188.535-719.421-512.953-876.293C1307.807 131.856 1165.949 98.797 1024 99a832 832 0 0 0-8.523-.072m25.351 99.972c353.073 1.939 685.605 257.36 776.918 599.03c97.03 326.907-34.214 705.405-315.906 899.025C1209.227 1912.03 775.3 1896.47 498.977 1660.8c-278.414-221.98-378.072-632.576-235.227-958.182C387.557 401.605 698.338 195.18 1024 199q8.421-.146 16.828-.1"/>',
  'end-event':
    '<path fill="currentColor" d="M1015.043 99.002C599.21 95.906 209.098 411.146 121.606 817.247c-84.386 356.719 66.704 754.624 369.312 962.585c293.721 210.37 712.33 226.857 1017.865 31.474c307.224-188.136 488.14-563.828 430.814-921.32c-52.494-370.583-348.523-692.886-716.13-769.06c-68.345-15.248-138.415-22.388-208.424-21.924m22.08 289.882c305.56-.968 586.24 251.915 617.384 556.116c39.754 290.762-147.703 594.914-429.538 682.33c-275.076 93.609-606.772-25.852-750.075-281.009c-158.564-264.725-91.1-641.965 160.165-825.757c113.947-87.92 258.202-134.99 402.064-131.68"/>',
  'user-task':
    '<g transform="translate(0 947.638)"><rect width="1800" height="1460" x="100" y="-677.638" fill="transparent" stroke="currentColor" stroke-linecap="round" stroke-width="120" rx="329.651" ry="328.5"/><path fill="currentColor" fill-rule="evenodd" d="M655.765-469.546c-101.845 0-174.703 78.293-174.907 167.474v.05c.006 26.97 7.304 55.433 18.706 81.107c8.233 18.537 18.468 35.579 30.94 49.231c-74.126 25.36-160.969 67.099-204.863 149.4l-2.366 4.436v266.423h664.98V-17.848l-2.365-4.435c-43.263-81.119-128.227-122.799-201.637-148.264c35.836-36.442 46.408-83.478 46.42-131.475v-.05c-.205-89.181-73.062-167.474-174.908-167.474m-69.537 94.964c4.707.012 9.876.169 15.574.505c45.398 2.676 60.678 10.848 72.422 18.598s20.025 15.128 51.063 16.033h.02c24.187-.905 35.82-5.217 44.16-10.102c3.38-1.98 6.22-4.037 9.128-6.002c7.687 16.478 11.815 34.694 11.862 53.545c-.016 53.681-9.245 91.274-58.465 122.037l4.815 36.29a825 825 0 0 1 31.583 10.269c1.5 6.262 3.235 14.475 4.401 23.206c1.222 9.148 1.703 18.665.95 25.811s-2.973 11.004-3.362 11.394c-25.018 25.017-69.426 39.607-114.47 39.607s-89.452-14.59-114.47-39.607c-.389-.39-2.608-4.248-3.361-11.394s-.273-16.663.95-25.81c1.172-8.78 2.92-17.042 4.427-23.316a826 826 0 0 1 31.27-10.16l2.87-38.885c-2.337-2.998-4.718-4.983-7.56-7.115c-10.986-8.242-24.307-26.372-33.717-47.56c-9.407-21.18-15.235-45.39-15.244-64.771c.059-23.235 6.312-45.507 17.796-64.744c2.055-.765 4.222-1.574 6.657-2.375c8.565-2.817 20.301-5.505 40.701-5.454m-86.95 258.269c-.035.263-.076.52-.111.785c-1.486 11.124-2.36 23.233-1.082 35.353s4.476 25.169 14.919 35.612C548.65-8.917 602.597 6.824 655.909 6.824s107.259-15.74 142.905-51.387c10.443-10.443 13.641-23.492 14.919-35.612c1.277-12.12.404-24.229-1.082-35.353c-.03-.22-.063-.432-.093-.65C866.752-92.413 919.136-58.376 948.04-7.557V208.36h-96.228V56.12h-40.215v152.24H499.071V56.12h-40.214v152.24H363.49V-7.556c28.96-50.915 81.486-84.985 135.789-108.757z"/></g>',
  'service-task':
    '<g transform="translate(0 947.638)"><rect width="1800" height="1460" x="100" y="-677.638" fill="transparent" stroke="currentColor" stroke-linecap="round" stroke-width="120" rx="329.651" ry="328.5"/><path fill="currentColor" d="M502.79-516.77c-.028 23.168.007 46.336.067 69.504c-19.758 5.59-37.813 13.39-54.864 22.947l-49.833-49.234l-93.18 93.72l49.829 49.225a246.4 246.4 0 0 0-22.387 54.63l-70.587.128v131.994l71.324-.257c6.522 25.86 20.717 49.109 34.855 69.897v-113.856l-62.346.224v-44.248l62.035-.113l3.482-17.64a202.7 202.7 0 0 1 29.584-72.195l9.884-15.012l-43.584-43.057l31.368-31.55l43.664 43.139l14.86-9.916c22.707-14.982 47.545-25.025 72.312-30.255l17.507-3.635l-.156-60.606h45.064l-.348 60.29h118.245c-11.092-13.24-57.058-30.468-74.208-35.27l.398-68.853c-49.093-.001-87.582.003-132.984-.001zM627.5-390.494l.18 69.501c-19.758 5.59-37.813 13.39-54.864 22.947l-49.834-49.234l-93.181 93.72l49.83 49.225a246.4 246.4 0 0 0-22.388 54.631l-70.585.128v131.993l71.323-.256c5.614 19.573 13.396 37.446 22.934 54.32l-51.03 50.83l94.218 92.6l50.847-50.61a247.4 247.4 0 0 0 55.125 22.405l.034 71.832c45.33.397 93.594.192 132.335.188v-72.682c19.774-5.575 37.885-13.432 54.94-22.984l50.805 50.093l93.242-93.603l-50.912-50.172a247 247 0 0 0 22.417-54.728l69.117-.427v-131.866l-69.893.426c-5.618-19.591-13.288-37.344-22.952-54.329l48.292-48.416l-94.166-92.757l-48.23 48.395a249.6 249.6 0 0 0-54.904-22.317l.396-68.853zm43.947 43.833h45.064l-.347 60.29l17.8 3.494c25.844 5.071 50.615 15.116 72.647 29.476l14.918 9.724l42.09-42.233l31.696 31.222l-42.148 42.257l10.14 14.97c14.882 22.463 24.753 46.744 30.326 71.748l3.666 17.54l60.916-.37v44.203l-60.576.373l-3.48 17.54a203.3 203.3 0 0 1-29.617 72.261l-9.896 15.032l44.621 43.973l-31.363 31.484l-44.626-44l-14.834 9.856c-22.715 14.844-47.355 25.124-72.214 30.189l-17.624 3.52v64.005c-12.048.03-25.192.01-44.69-.017l-.028-63.526l-17.704-3.458c-25.88-5.053-50.61-15.051-72.604-29.472l-14.875-9.752l-44.798 44.591l-31.7-31.158l44.86-44.685l-10.237-15.031c-14.895-22.414-24.748-46.721-30.33-71.696l-3.663-17.487l-62.346.223v-44.246l62.035-.114l3.482-17.639a202.7 202.7 0 0 1 29.583-72.196l9.885-15.012l-43.586-43.058l31.368-31.55l43.665 43.14l14.86-9.916c22.737-14.884 46.864-24.76 72.312-30.253l17.51-3.635zm23.272 161.057c-54.257 0-98.71 44.455-98.71 98.712s44.453 98.71 98.71 98.71s98.712-44.453 98.712-98.71s-44.455-98.712-98.712-98.712m0 43.833c30.568 0 54.879 24.311 54.879 54.88c0 30.567-24.31 54.876-54.879 54.876s-54.877-24.309-54.877-54.877s24.31-54.88 54.877-54.88z"/></g>',
  'gateway-xor':
    '<path fill="currentColor" d="M1024.022 99.36c-19.324-.017-38.646 7.15-52.98 21.55L120.937 971.023c-28.67 28.668-28.537 77.295.132 105.963l849.971 849.965c28.67 28.678 77.294 28.804 105.963 0l850.106-850.1c28.669-28.667 28.536-77.296-.135-105.964L1077.002 120.91c-14.334-14.334-33.657-21.534-52.98-21.55m-.065 126.045l798.66 798.666l-798.66 798.657l-798.66-798.657zM725.686 669.792c-.014 0-9.612 1.838-9.62 1.838c-.01 0-8.144 5.513-8.15 5.513l-30.732 30.739c-.01 0-5.61 8.225-5.614 8.322c0 .01-1.737 9.48-1.736 9.48c0 .01 1.868 9.385 1.871 9.385c0 .01 5.338 8.322 5.344 8.322l280.707 280.7l-280.572 280.574v-.088c0 .01-5.61 8.32-5.614 8.32c0 .01-1.736 9.483-1.736 9.483c0 .02 1.868 9.385 1.871 9.385c0 0 5.339 8.223 5.344 8.32l30.734 30.728c.01.01 8.411 5.516 8.418 5.516c.01 0 9.346 1.838 9.354 1.838c.01 0 9.479-1.74 9.486-1.74c.01 0 8.28-5.614 8.285-5.614l280.576-280.582l280.637 280.641c.01.01 8.412 5.516 8.418 5.516c.01 0 9.346 1.838 9.354 1.838c.01 0 9.48-1.743 9.488-1.743c.01 0 8.276-5.61 8.281-5.61l30.735-30.73c.01-.01 5.475-8.126 5.48-8.126c0-.01 1.871-9.58 1.871-9.676c0-.01-1.869-9.385-1.873-9.385c0 0-5.472-8.418-5.478-8.418l-280.606-280.611l280.608-280.604c.01 0 5.473-8.127 5.478-8.127c0-.01 1.871-9.578 1.871-9.578c0-.02-1.868-9.385-1.87-9.385c0-.01-5.606-8.322-5.612-8.322l-30.735-30.738c-.01 0-8.143-5.514-8.15-5.514c-.01 0-9.345-1.84-9.353-1.84c-.01 0-9.613 1.84-9.62 1.84c-.01 0-8.145 5.514-8.15 5.514l-280.613 280.613l-280.739-280.748v-.088c-.01 0-8.278-5.32-8.285-5.32c-.01 0-9.34-1.837-9.351-1.838z"/>',
  'gateway-parallel':
    '<path fill="currentColor" d="M1024.022 99.36c-19.324-.017-38.646 7.15-52.98 21.55L120.937 971.023c-28.67 28.668-28.537 77.295.132 105.963l849.971 849.965c28.67 28.678 77.294 28.804 105.963 0l850.106-850.1c28.669-28.667 28.536-77.296-.135-105.964L1077.002 120.91c-14.334-14.334-33.657-21.534-52.98-21.55m-.065 126.045l798.66 798.666l-798.66 798.657l-798.66-798.657zm-21.803 329.82c0 .01-9.657 1.838-9.662 1.838c-.01 0-7.908 5.323-7.914 5.323c-.01.01-5.497 8.127-5.502 8.127c0 .01-1.86 9.675-1.863 9.675V977.04H580.188l-.067-.078c0 .01-9.618 2.129-9.623 2.129c-.01.01-7.907 5.322-7.912 5.322l.008-.098c-.01.01-5.497 8.127-5.502 8.127c-.01 0-1.861 9.676-1.865 9.676v43.47s1.848 9.783 1.914 9.85c0 .01 5.478 7.934 5.478 7.934c.01.01 7.957 5.322 7.96 5.322c.01.01 9.656 2.127 9.66 2.127h396.978v396.785l-.063-.058c0 .01 1.916 9.85 1.915 9.85c0 .01 5.476 7.933 5.476 7.933c.01.01 7.96 5.32 7.961 5.32c0 0 9.59 2.032 9.662 2.13l43.461-.01c.011 0 9.846-2.032 9.852-2.032c0 0 7.908-5.32 7.914-5.32c.01-.01 5.47-7.936 5.476-7.936c0 0 1.887-9.82 1.89-9.82V1070.86h396.88c.011.01 9.847-2.031 9.851-2.031c.01 0 7.91-5.322 7.914-5.322c.01-.01 5.471-7.934 5.477-7.934c0 0 1.886-9.82 1.89-9.82v-43.461c0-.01-1.877-9.58-1.874-9.676c-.01-.01-5.45-8.127-5.518-8.127c-.01-.01-7.958-5.32-7.96-5.32c0 .01-9.82-2.13-9.825-2.033h-396.838V580.294c0-.01-1.878-9.577-1.875-9.674c-.01-.01-5.45-8.129-5.45-8.129c-.01-.01-7.956-5.32-7.958-5.32c-.01 0-9.848-1.936-9.852-1.936z"/>',
  'gateway-or':
    '<path fill="currentColor" d="M1024.022 99.36c-19.324-.017-38.646 7.15-52.98 21.55L120.937 971.023c-28.67 28.668-28.537 77.295.132 105.963l849.971 849.965c28.67 28.678 77.294 28.804 105.963 0l850.106-850.1c28.669-28.667 28.536-77.296-.135-105.964L1077.002 120.91c-14.334-14.334-33.657-21.534-52.98-21.55m-.065 126.045l798.66 798.666l-798.66 798.657l-798.66-798.657zm.043 368.6c-237.232 0-430 192.78-430 430.008s192.768 430 430 430s430-192.772 430-430c0-237.229-192.768-430.008-430-430.008m0 47.69c211.408 0 382.323 170.912 382.323 382.318s-170.915 382.33-382.323 382.33s-382.322-170.925-382.322-382.33c0-211.406 170.915-382.319 382.322-382.319z"/>',
  'gateway-eventbased':
    '<path fill="currentColor" d="M1024.022 99.36c-19.324-.017-38.646 7.15-52.98 21.55L120.937 971.023c-28.67 28.668-28.537 77.295.132 105.963l849.971 849.965c28.67 28.678 77.294 28.804 105.963 0l850.106-850.1c28.669-28.667 28.536-77.296-.135-105.964L1077.002 120.91c-14.334-14.334-33.657-21.534-52.98-21.55m-.065 126.045l798.66 798.666l-798.66 798.657l-798.66-798.657zm.045 339.555l-14.703 10.672l-426.28 309.453l168.44 517.967h545.082l168.44-517.967zm-.004 61.775l382.178 277.44l-145.977 448.904H787.801L641.824 904.175z"/>',
  'intermediate-event':
    '<path fill="currentColor" d="M1014.917 99.38C602.359 95.992 214.146 405.7 123.514 807.93c-87.435 354.3 56.648 752.505 355.006 964.288c296.555 219.193 725.95 237.528 1036.419 36.05c305.059-189.587 481.982-565.095 423.873-920.972c-52.303-361.1-335.007-676.97-691.487-760.448c-75.897-18.993-154.19-28.02-232.408-27.469zm16.935 99.926c383.36-3.87 741.982 297.902 803.761 676.428c65.397 341.935-110.432 714.482-420.203 875.895c-316.714 174.3-744.482 109.02-990.397-157.746c-252.123-260.217-301.105-691.754-106.818-999.09c147.692-243.691 427.858-402.047 713.657-395.487m-23.998 90.01c-353 0-676.469 292.144-714.39 643.106c-45.155 328.882 161.729 671.9 475.565 782.315c297.323 112.359 660.552 5.805 846.145-253.464c200.28-265.219 188.76-667.643-34.507-916.046c-140.914-164.064-356.106-262.094-572.813-255.912zm29.352 97.942c312.462 0 597.21 263.661 621.056 575.302c32.576 296.858-171.147 599.685-461.219 675.703c-279.557 81.544-605.018-54.085-737.466-315.095c-142.555-263.797-69.45-624.646 174.35-803.34c114.238-88.325 258.887-135.966 403.279-132.57"/>',
  'send-task':
    '<g stroke="currentColor" transform="translate(0 947.638)"><rect width="1800" height="1460" x="100" y="-677.638" fill="transparent" stroke-linecap="round" stroke-width="120" rx="329.651" ry="328.5"/><g fill="currentColor" fill-rule="evenodd" stroke-width=".623"><path d="M346.858-428.042h999.853l-499.927 283z"/><path d="m348.104-323.32l498.68 279.261l501.174-279.26V235.2H348.104z"/></g></g>',
  'receive-task':
    '<g stroke="currentColor" transform="translate(0 947.638)"><rect width="1800" height="1460" x="100" y="-677.638" fill="transparent" stroke-linecap="round" stroke-width="120" rx="329.651" ry="328.5"/><g fill="none" stroke-width="45.443"><path d="M376.496-429.067h1007.533v649.183H376.496z"/><path stroke-miterlimit="1.4" d="m386.883-429.067l493.38 324.592l493.379-324.592z"/></g></g>',
  'manual-task':
    '<g stroke="currentColor" stroke-linecap="round" transform="translate(0 947.638)"><rect width="1800" height="1460" x="100" y="-677.638" fill="transparent" stroke-width="120" rx="329.651" ry="328.5"/><path fill="none" stroke-width="43.664" d="M782.99 94.728h320.662c31.894 0 46.426-18.387 52.19-46.737c8.96-43.893-13.184-85.435-52.814-85.533c-97.378-.489-320.04-.196-320.04-.196v.223s340.368.268 379.564 0c39.195-.27 53.287-33.884 53.405-71.521c.12-37.54-18.907-70.744-53.287-70.793c-117.153-.098-379.68-.635-379.68-.635v-.194s199.412.465 285.185.465c35.051-.098 53.445-30.314 53.327-68.293c-.237-37.197-19.42-63.45-53.722-63.45c-137.086-.244-428.878 1.895-437.468-.146c-2.274-.54-4.22-4.971-2.723-6.794c14.054-17.122 80.562-79.478 95.325-98.59c18.512-23.803 20.486-56.943 6.394-78.401c-16.341-24.977-38.406-24.44-58.418-11.536c-57.669 37.344-260.516 178.067-305.237 208.763c-35.525 24.39-59.84 61.245-74.287 107.045c-14.604 46.435-13.105 100.51-12.947 147.875c.158 35.095.949 63.478 9.554 98.573c24.827 102.01 90.39 154.164 186.464 154.457c182.282.684 364.643.929 546.964 0c29.801-.195 46.221-19.702 46.655-55.482c.474-36.854-16.696-58.591-46.695-58.787c-70.181-.489-238.37 0-238.37 0z"/></g>',
  'script-task':
    '<g stroke="currentColor" stroke-linecap="round" transform="translate(0 947.638)"><rect width="1800" height="1460" x="100" y="-677.638" fill="transparent" stroke-width="120" rx="329.651" ry="328.5"/><g fill="currentColor"><path stroke-width="39.211" d="M617.972-400.601h385.587c-53.584 33.412-91.006 64.126-115.713 92.986c-27.626 32.271-39.502 62.537-39.847 90.995c-.69 56.917 43.32 103.72 87.089 148.545c43.769 44.826 87.403 88.112 92.236 134.132c2.417 23.01-4.204 47.213-25.991 74.693c-21.596 27.238-58.302 57.333-115.081 90.584h-385.35c47.42-29.443 79.701-56.674 100.263-82.608c23.32-29.414 31.479-57.55 28.7-84.01c-5.559-52.922-52.218-97.105-95.82-141.76s-84.043-89.346-83.435-139.42c.303-25.037 10.513-52.142 36.76-82.801c26.037-30.414 67.925-64.053 130.602-101.336zm-3.565-12.838l-1.512.898c-64.281 38.092-107.649 72.655-135.276 104.926s-39.502 62.537-39.847 90.995c-.69 56.917 43.317 103.72 87.086 148.545c43.77 44.826 87.405 88.112 92.24 134.132c2.416 23.01-4.205 47.213-25.992 74.693s-58.89 57.857-116.533 91.459l-20.523 11.963h435.717l1.5-.873c58.473-34.086 96.805-65.16 120.126-94.573c23.32-29.414 31.478-57.55 28.699-84.01c-5.559-52.922-52.218-97.105-95.82-141.76s-84.042-89.346-83.435-139.42c.304-25.037 10.513-52.142 36.76-82.801c26.248-30.66 68.544-64.587 132.07-102.231l20.151-11.943z"/><path stroke-width="11.203" d="M697.142 101.845v12.838H942.48v-12.838zm-35.399-129.49v12.837h236.374v-12.838zm-115.835-129.49v12.838h244.439v-12.837zm9.187-129.49v12.837H791.14v-12.838z"/></g></g>',
  'business-rule-task':
    '<g transform="translate(0 947.638)"><rect width="1800" height="1460" x="100" y="-677.638" fill="transparent" stroke="currentColor" stroke-linecap="round" stroke-width="120" rx="329.651" ry="328.5"/><path fill="currentColor" d="M404.762-425.075V-209.9h921.642v-215.175z"/><path fill="currentColor" d="M378.773-452.176v235.457h969.73v-235.457z"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="43.105" d="M379.284-93.79v-358.386H1348.4v716.774H617.528v-486.713v486.713H379.284V17.32H1348.4H379.284z"/></g>',
  'call-activity':
    '<rect width="1700" height="1360" x="150" y="-627.638" fill="transparent" stroke="currentColor" stroke-linecap="round" stroke-width="220" rx="311.337" ry="306" transform="translate(0 947.638)"/>',
  'subprocess-expanded':
    '<g transform="translate(0 995.638)"><path fill="currentColor" d="M677.543 49.587V742.5h692.914V49.587zm63.468 63.489h565.978v565.956H741.01z"/><path fill="currentColor" d="M816.126 337.803v96.207h415.748v-96.207z"/><rect width="1699.302" height="1400.778" x="174.349" y="-672.027" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="100" rx="266.951"/></g>',
  'task-none':
    '<path fill="currentColor" d="M429.65 210C214.934 210 40 384.196 40 598.5v803c0 214.304 174.934 388.5 389.65 388.5h1140.7c214.716 0 389.65-174.196 389.65-388.5v-803c0-214.304-174.934-388.5-389.65-388.5zm0 120h1140.7C1720.887 330 1840 448.826 1840 598.5v803c0 149.674-119.113 268.5-269.65 268.5H429.65C279.113 1670 160 1551.174 160 1401.5v-803C160 448.826 279.113 330 429.65 330"/>',
}

const typeLabelKey: Record<string, string> = {
  'bpmn:StartEvent': 'start-event',
  'bpmn:EndEvent': 'end-event',
  'bpmn:UserTask': 'user-task',
  'bpmn:ServiceTask': 'service-task',
  'bpmn:SendTask': 'send-task',
  'bpmn:ReceiveTask': 'receive-task',
  'bpmn:ManualTask': 'manual-task',
  'bpmn:ScriptTask': 'script-task',
  'bpmn:BusinessRuleTask': 'business-rule-task',
  'bpmn:CallActivity': 'call-activity',
  'bpmn:SubProcess': 'sub-process',
  'bpmn:ExclusiveGateway': 'exclusive-gateway',
  'bpmn:ParallelGateway': 'parallel-gateway',
  'bpmn:InclusiveGateway': 'inclusive-gateway',
  'bpmn:EventBasedGateway': 'event-based-gateway',
  'bpmn:IntermediateCatchEvent': 'intermediate-catch-event',
  'bpmn:IntermediateThrowEvent': 'intermediate-throw-event',
  'bpmn:BoundaryEvent': 'boundary-event',
}

export default defineComponent({
  name: 'TimelinePanel',
  props: {
    executionState: { type: Object as PropType<ProcessExecutionState | null>, default: null },
    elementInfoMap: {
      type: Object as PropType<Record<string, { name: string; type: string }>>,
      default: () => ({}),
    },
  },
  setup(props) {
    const { t } = useCamundaI18n()

    const collapsed = ref(false)
    const panelWidth = ref(280)
    const isResizing = ref(false)
    let resizeStartX = 0
    let resizeStartWidth = 0

    const orderList = computed(() => {
      const state = props.executionState
      if (!state?.executionOrder) return []
      return state.executionOrder.map((id, i) => {
        const node = state.elements[id]
        const info = props.elementInfoMap?.[id]
        const result = state.results?.[i]
        const rawStatus = node?.status || 'pending'
        const status: ExecutionStatus =
          result && (result.includes('驳回') || result.includes('reject')) ? 'rejected' : rawStatus
        return {
          id,
          status,
          name: info?.name || id,
          type: info?.type || '',
          assignee: node?.assignee,
          visitCount: node?.visitCount || 1,
          rejectCount: node?.rejectCount || 0,
          timestamp: state.timestamps?.[i],
          result: state.results?.[i],
        }
      })
    })

    function toggleCollapse() {
      collapsed.value = !collapsed.value
    }

    function onResizeStart(e: PointerEvent) {
      isResizing.value = true
      resizeStartX = e.clientX
      resizeStartWidth = panelWidth.value
      e.preventDefault()
    }

    function onPointerMove(e: PointerEvent) {
      if (!isResizing.value) return
      const delta = resizeStartX - e.clientX
      const w = Math.max(220, Math.min(500, resizeStartWidth + delta))
      panelWidth.value = w
    }

    function onPointerUp() {
      isResizing.value = false
    }

    onMounted(() => {
      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
    })

    return () => {
      const state = props.executionState
      if (!state || !state.executionOrder || state.executionOrder.length === 0) return null

      if (collapsed.value) {
        return (
          <div
            class="absolute right-8px top-8px z-20 cursor-pointer select-none text-14px leading-none text-#666 hover:text-#2563eb bg-#fff dark:bg-#1a1a1a rounded shadow px-5px py-3px"
            onClick={toggleCollapse}
            title={t('bpmnViewer.timeline.expand')}
          >
            📋
          </div>
        )
      }

      return (
        <div
          class="h-full flex bg-#fff dark:bg-#1a1a1a shadow-lg"
          style={{ width: `${panelWidth.value}px`, minWidth: '220px' }}
        >
          <div
            class="shrink-0 cursor-col-resize hover:bg-#2563eb transition-colors"
            style={{ width: '4px', marginLeft: '-2px' }}
            title="拖拽调整宽度"
            onPointerdown={onResizeStart}
          />

          <div class="flex-1 flex flex-col min-w-0">
            <div class="flex items-center gap-6px px-12px py-8px text-12px font-bold text-#333 dark:text-#ccc border-b border-solid border-#e5e7eb dark:border-#333 shrink-0">
              <span>📋</span>
              <span>{t('bpmnViewer.timeline.title')}</span>
              <span class="text-10px text-#888 font-normal">({orderList.value.length})</span>
              <div
                class="ml-auto cursor-pointer select-none text-12px text-#666 hover:text-#2563eb px-4px"
                onClick={toggleCollapse}
                title="收起执行时间线"
              >
                ◀
              </div>
            </div>

            <div class="flex-1 overflow-y-auto py-8px px-4px camunda-props-scroll">
              <NTimeline size="medium">
                {orderList.value.map((item, index) => {
                  const prevStatus = index > 0 ? orderList.value[index - 1]?.status : null
                  const isPrevRejected = prevStatus === 'rejected'

                  return (
                    <NTimelineItem
                      key={`${item.id}-${index}`}
                      type={statusType[item.status]}
                      color={statusColor[item.status]}
                      lineType={isPrevRejected ? 'dashed' : 'default'}
                      time={item.timestamp || ''}
                      title={item.name}
                    >
                      {{
                        default: () => (
                          <div class="flex flex-col gap-2px">
                            {item.result && (
                              <span
                                class="text-12px font-bold"
                                style={{
                                  color:
                                    item.result.includes('驳回') || item.result.includes('reject')
                                      ? '#dc2626'
                                      : '#16a34a',
                                }}
                              >
                                {item.result}
                              </span>
                            )}
                            <span class="text-11px text-#666 dark:text-#999">
                              {[
                                item.type
                                  ? t(`bpmnPanel.types.${typeLabelKey[item.type] || 'unknown'}`) ||
                                    item.type.replace('bpmn:', '')
                                  : '',
                                item.assignee
                                  ? `${t('bpmnViewer.tooltip.assignee')}: ${item.assignee}`
                                  : '',
                              ]
                                .filter(Boolean)
                                .join(' | ')}
                            </span>
                          </div>
                        ),

                        footer: () => {
                          const badges: any[] = []
                          if (item.visitCount > 1) {
                            badges.push(
                              <span class="text-10px text-#2563eb font-medium">
                                ↻ {item.visitCount}
                              </span>,
                            )
                          }
                          if (item.rejectCount > 0) {
                            badges.push(
                              <span class="text-10px text-#dc2626 font-bold">
                                ✕ {item.rejectCount}
                              </span>,
                            )
                          }
                          if (item.status === 'active') {
                            badges.push(
                              <span class="text-10px text-#2563eb font-medium">
                                ● {t('bpmnViewer.tooltip.active')}
                              </span>,
                            )
                          }
                          if (badges.length === 0) return null
                          return <div class="flex gap-8px mt-4px">{badges}</div>
                        },
                      }}
                    </NTimelineItem>
                  )
                })}
              </NTimeline>
            </div>
          </div>
        </div>
      )
    }
  },
})
