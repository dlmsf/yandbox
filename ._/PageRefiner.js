// PageRefiner.js - Modular prompt refinement system for HTML generation

class PageRefinerFunc {
    constructor(build, config = {}) {
        this.Name = config.name || `Refiner_${Math.random().toString(36).substring(2, 8)}`;
        this.Linked = config.linked || [];
        this._segments = [];
        this._build = build;
    }
    
    Text(text = '') {
        this._segments.push(text);
        return this;
    }
    
    NewLine(count = 1) {
        this._segments.push('\n'.repeat(count));
        return this;
    }
    
    Space(count = 1) {
        this._segments.push(' '.repeat(count));
        return this;
    }
    
    Build() {
        return this._segments.join('');
    }
    
    async Execute(props = {}) {
        this._segments = [];
        await this._build.call(this, props);
        return this.Build();
    }
}

class PageRefiner {
    constructor(mainfunc = null) {
        this.Funcs = [];
        
        if (mainfunc) {
            if (typeof mainfunc === 'function') {
                if (mainfunc.prototype instanceof PageRefinerFunc) {
                    // Class extending PageRefinerFunc
                    const funcs = [];
                    const toadd = [];
                    const firstfunc = new mainfunc();
                    funcs.push(firstfunc);
                    toadd.push(...firstfunc.Linked);
                    
                    while (toadd.length) {
                        toadd.forEach((f, i) => {
                            const instancedfunc = new f();
                            if (!funcs.find(e => e.Name === instancedfunc.Name)) {
                                funcs.push(instancedfunc);
                                toadd.push(...instancedfunc.Linked);
                            }
                            toadd.splice(i, 1);
                        });
                    }
                    
                    this.Funcs.push(...funcs);
                } else {
                    // Plain build function
                    this.Funcs.push(new PageRefinerFunc(mainfunc));
                }
            } else if (mainfunc instanceof PageRefinerFunc) {
                this.Funcs.push(mainfunc);
            }
        }
    }
    
    Add(build, config = {}) {
        if (build instanceof PageRefinerFunc) {
            this.Funcs.push(build);
        } else if (typeof build === 'function') {
            if (build.prototype instanceof PageRefinerFunc) {
                // Class extending PageRefinerFunc
                const funcs = [];
                const toadd = [];
                const firstfunc = new build();
                funcs.push(firstfunc);
                toadd.push(...firstfunc.Linked);
                
                while (toadd.length) {
                    toadd.forEach((f, i) => {
                        const instancedfunc = new f();
                        if (!funcs.find(e => e.Name === instancedfunc.Name)) {
                            funcs.push(instancedfunc);
                            toadd.push(...instancedfunc.Linked);
                        }
                        toadd.splice(i, 1);
                    });
                }
                
                this.Funcs.push(...funcs);
            } else {
                // Plain build function
                this.Funcs.push(new PageRefinerFunc(build, config));
            }
        }
        return this;
    }
    
    async GetPrompt(props = {}) {
        if (this.Funcs.length === 0) return '';
        
        let fullPrompt = '';
        for (const func of this.Funcs) {
            const built = await func.Execute(props);
            if (built.length) {
                fullPrompt += built + '\n\n';
            }
        }
        
        return fullPrompt.trim();
    }

    static Func = PageRefinerFunc
}

// Default refiner
class DefaultDesignPrinciples extends PageRefinerFunc {
    constructor() {
        super(async () => {
            
            this.Text(`IMPORTANT DESIGN PRINCIPLES:
- Create responsive, mobile-first designs
- Use semantic HTML5 elements
- Ensure proper contrast and readability
- Add smooth transitions and subtle animations
- Include proper meta viewport tag
- Use CSS Grid or Flexbox for layouts
- Keep code clean and well-commented`);
            
            this.NewLine(2);
            
            this.Text(`INTERACTIVITY GUIDELINES:
- Add intuitive hover effects
- Ensure keyboard accessibility
- Use CSS transitions for state changes
- Implement smooth scrolling behavior`);
        }, { name: 'DefaultDesignPrinciples' });
    }
}

const DefaultRefiner = new PageRefiner(DefaultDesignPrinciples);

export { PageRefiner, PageRefinerFunc, DefaultRefiner };
export default PageRefiner;