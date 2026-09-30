/** GET /profile —— 顶栏左上角的孩子档案 */

import { defineMock } from '../server'
import { childProfile } from '../db'

defineMock('GET', '/profile', () => childProfile)
